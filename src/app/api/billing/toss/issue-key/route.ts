import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function addOneMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

async function readResponseBodySafe(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (contentType.includes("application/json")) {
    try {
      return { ok: true, json: JSON.parse(text), text };
    } catch {
      return { ok: false, json: null as any, text };
    }
  }

  return { ok: false, json: null as any, text };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authKey, customerKey, planCode } = body ?? {};

    if (!authKey || !customerKey) {
      return NextResponse.json(
        { message: "authKey 또는 customerKey가 누락되었습니다." },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { message: "TOSS_SECRET_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { message: "Supabase 서버 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const provider = "tosspayments";
    const now = new Date();

    // ✅ (안전장치) 이미 active이고 만료 전이면 trial로 덮어쓰지 않기
    // ✅ provider 조건을 반드시 넣어서 "토스 구독"만 확인
    const { data: existingSub, error: existingError } = await supabaseAdmin
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", customerKey)
      .eq("provider", provider)
      .maybeSingle();

    if (existingError) {
      console.error("existing subscription lookup error:", existingError);
    }

    if (
      existingSub?.status === "active" &&
      existingSub.current_period_end &&
      new Date(existingSub.current_period_end) > now
    ) {
      return NextResponse.json({
        success: true,
        message: "이미 프리미엄 이용 중입니다. (만료 전이라 재등록을 생략합니다.)",
      });
    }

    // ✅ 토스 billingKey 발급
    const encodedKey = Buffer.from(`${secretKey}:`).toString("base64");

    const tossResponse = await fetch(
      "https://api.tosspayments.com/v1/billing/authorizations/issue",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodedKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authKey, customerKey }),
      }
    );

    const parsed = await readResponseBodySafe(tossResponse);
    const tossResult = parsed.json ?? {};

    if (!tossResponse.ok) {
      console.error("billing issue failed:", {
        status: tossResponse.status,
        body: parsed.json ?? parsed.text,
      });

      return NextResponse.json(
        {
          message:
            tossResult?.message ||
            "빌링키 발급에 실패했습니다. (Toss 응답을 확인하세요.)",
          // 개발할 때만 보고 싶으면 아래 주석 해제
          // debug: process.env.NODE_ENV === "development" ? (parsed.json ?? parsed.text) : undefined,
        },
        { status: 400 }
      );
    }

    if (!tossResult?.billingKey || !tossResult?.customerKey) {
      console.error("tossResult missing keys:", tossResult);
      return NextResponse.json(
        { message: "Toss 응답에 billingKey/customerKey가 없습니다." },
        { status: 500 }
      );
    }

    // ✅ 첫달 무료(trial): 결제 승인/청구는 하지 않고, next_billing_at만 1개월 뒤로 설정
    const trialEnd = addOneMonth(now);
    const currentPeriodStart = now.toISOString();
    const currentPeriodEnd = trialEnd.toISOString();

    const finalPlanCode =
      planCode === "premium_yearly" ? "premium_yearly" : "premium_monthly";

    // ✅ 핵심: upsert 충돌 기준을 (user_id, provider)로!
    const { error: upsertError } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: customerKey,
          provider,
          billing_key: tossResult.billingKey,
          customer_key: tossResult.customerKey,
          plan_code: finalPlanCode,
          status: "trial",
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          next_billing_at: currentPeriodEnd,
          raw_payload: tossResult,
          updated_at: now.toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (upsertError) {
      console.error("subscription upsert error:", upsertError);
      return NextResponse.json(
        {
          message:
            "구독 정보 저장에 실패했습니다. (DB 유니크 제약/컬럼명을 확인하세요.)",
        },
        { status: 500 }
      );
    }

    // ✅ 무료기간에도 프리미엄 기능 접근 가능하도록 profiles 업데이트
    // update가 0행이면(프로필 row 없음) upsert로 fallback
    const { data: updatedProfile, error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: true,
        premium_plan: finalPlanCode,
        premium_updated_at: now.toISOString(),
        premium_expires_at: currentPeriodEnd,
      })
      .eq("id", customerKey)
      .select("id")
      .maybeSingle();

    if (profileUpdateError) {
      console.error("profile update error:", profileUpdateError);
    }

    if (!updatedProfile) {
      const { error: profileUpsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: customerKey,
            is_premium: true,
            premium_plan: finalPlanCode,
            premium_updated_at: now.toISOString(),
            premium_expires_at: currentPeriodEnd,
          },
          { onConflict: "id" }
        );

      if (profileUpsertError) {
        console.error("profile upsert error:", profileUpsertError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "결제수단 등록 완료! 첫달 무료가 적용되었습니다.",
      trialEnd: currentPeriodEnd,
      nextBillingAt: currentPeriodEnd,
      planCode: finalPlanCode,
      // billingKey는 굳이 프론트에 줄 필요 없으면 빼는 걸 추천
      // billingKey: tossResult.billingKey,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "빌링키 발급 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}