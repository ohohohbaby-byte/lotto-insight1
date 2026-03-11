import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { message: "Supabase 서버 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json(
        { message: "로그인이 필요합니다. (Authorization 토큰 없음)" },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ✅ 토큰으로 유저 검증
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json(
        { message: "유저 인증에 실패했습니다." },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const provider = "tosspayments";
    const nowIso = new Date().toISOString();

    // ✅ 토스 구독 1개 찾기
    const { data: sub, error: subError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, status, current_period_end, cancel_at")
      .eq("user_id", userId)
      .eq("provider", provider)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("subscription lookup error:", subError);
      return NextResponse.json(
        { message: "구독 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!sub) {
      return NextResponse.json(
        { message: "구독 정보가 없습니다." },
        { status: 404 }
      );
    }

    if (!sub.current_period_end) {
      return NextResponse.json(
        { message: "current_period_end가 없어 해지 예약을 할 수 없습니다." },
        { status: 500 }
      );
    }

    // ✅ 이미 해지 예약되어 있으면 그대로 성공 처리(멱등)
    if (sub.cancel_at) {
      return NextResponse.json({
        success: true,
        message: "이미 해지 예약이 되어 있습니다.",
        cancelAt: sub.cancel_at,
      });
    }

    // ✅ 해지 예약: cancel_at = current_period_end
    const { error: cancelError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at: sub.current_period_end,
        canceled_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", sub.id);

    if (cancelError) {
      console.error("cancel update error:", cancelError);
      return NextResponse.json(
        { message: "해지 처리 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    // profiles는 즉시 premium=false로 내리지 않음 (기간 끝까지 사용 가능)
    // 필요하면 premium_expires_at만 유지/갱신해도 OK
    await supabaseAdmin
      .from("profiles")
      .update({
        premium_updated_at: nowIso,
        premium_expires_at: sub.current_period_end,
      })
      .eq("id", userId);

    return NextResponse.json({
      success: true,
      message: "해지 예약 완료 (기간 종료일까지 사용 가능)",
      cancelAt: sub.current_period_end,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "해지 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
