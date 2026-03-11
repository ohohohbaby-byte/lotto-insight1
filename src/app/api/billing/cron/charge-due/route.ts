import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type SubscriptionRow = {
  id: string;
  user_id: string;
  provider: string | null;
  billing_key: string | null;
  customer_key: string | null;
  plan_code: string | null;
  status: string | null;
  next_billing_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function getPeriodKeyMonthly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`; // YYYYMM
}

function getPeriodKeyYearly(date: Date) {
  return `${date.getFullYear()}`; // YYYY
}

function getPlanConfig(planCode: string | null) {
  const code = planCode ?? "premium_monthly";

  if (code === "premium_yearly") {
    return {
      plan_code: "premium_yearly",
      amount: 99000,
      interval: "year" as const,
      orderName: "LOTTO INSIGHT GOLD MEMBERSHIP (YEARLY)",
    };
  }

  return {
    plan_code: "premium_monthly",
    amount: 9900,
    interval: "month" as const,
    orderName: "LOTTO INSIGHT GOLD MEMBERSHIP",
  };
}

function isAuthorized(req: NextRequest) {
  // Vercel 권장: CRON_SECRET + Authorization: Bearer <secret>
  const vercelCronSecret = process.env.CRON_SECRET;

  // 기존 유지: BILLING_CRON_SECRET + x-cron-secret
  const legacySecret = process.env.BILLING_CRON_SECRET;

  // 개발 편의: 둘 다 없으면 통과 (운영에서는 반드시 설정)
  if (!vercelCronSecret && !legacySecret) return true;

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  const xCron = req.headers.get("x-cron-secret");

  if (vercelCronSecret && bearer === vercelCronSecret) return true;
  if (legacySecret && xCron === legacySecret) return true;

  return false;
}

async function tossCharge({
  encodedKey,
  billingKey,
  customerKey,
  amount,
  orderId,
  orderName,
}: {
  encodedKey: string;
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
}) {
  const res = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encodedKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customerKey,
      amount,
      orderId,
      orderName,
    }),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { ok: res.ok, json };
}

async function runCharge() {
  const tossSecretKey = process.env.TOSS_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { success: false, message: "Supabase 서버 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  if (!tossSecretKey) {
    return NextResponse.json(
      { success: false, message: "TOSS_SECRET_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const encodedTossKey = Buffer.from(`${tossSecretKey}:`).toString("base64");
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const now = new Date();
  const nowIso = now.toISOString();

  // ✅ Toss만 우선 안정화: provider='tosspayments'만 처리
  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, user_id, provider, billing_key, customer_key, plan_code, status, next_billing_at, current_period_start, current_period_end, cancel_at"
    )
    .eq("provider", "tosspayments")
    .in("status", ["trial", "active", "past_due"])
    .not("next_billing_at", "is", null)
    .lte("next_billing_at", nowIso);

  if (subError) {
    console.error("subscription lookup error:", subError);
    return NextResponse.json(
      {
        success: false,
        message: "구독 조회에 실패했습니다.",
        error: subError.message,
      },
      { status: 500 }
    );
  }

  const dueSubscriptions = (subscriptions ?? []) as SubscriptionRow[];

  if (dueSubscriptions.length === 0) {
    return NextResponse.json({
      success: true,
      message: "청구 대상 구독이 없습니다.",
      chargedCount: 0,
      results: [],
    });
  }

  const results: Array<{
    userId: string;
    subscriptionId: string;
    success: boolean;
    message: string;
    provider?: string | null;
    orderId?: string;
  }> = [];

  for (const subscription of dueSubscriptions) {
    try {
      const plan = getPlanConfig(subscription.plan_code);

      const periodBase = subscription.next_billing_at
        ? new Date(subscription.next_billing_at)
        : new Date();

      const periodKey =
        plan.interval === "year"
          ? getPeriodKeyYearly(periodBase)
          : getPeriodKeyMonthly(periodBase);

      const orderId = `sub-${subscription.id}-${plan.plan_code}-${periodKey}`;

      // ✅ 1) 해지 예약이면: 청구하지 않고 종료 처리
      // 정책상 cancel_at = current_period_end (= next_billing_at)로 들어올 가능성이 큼
      if (subscription.cancel_at) {
        // 기간이 끝난 시점(= next_billing_at 도달)에는 프리미엄 종료 처리
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "cancelled",
            next_billing_at: null,
            updated_at: nowIso,
          })
          .eq("id", subscription.id);

        await supabaseAdmin
          .from("profiles")
          .update({
            is_premium: false,
            premium_updated_at: nowIso,
          })
          .eq("id", subscription.user_id);

        results.push({
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          success: true,
          message: "해지 예약된 구독이라 청구하지 않고 종료 처리했습니다.",
          provider: "tosspayments",
          orderId,
        });
        continue;
      }

      // ✅ 2) 멱등성: 같은 order_id가 이미 payments에 있으면 스킵
      const { data: existingPayment } = await supabaseAdmin
        .from("payments")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existingPayment) {
        results.push({
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          success: true,
          message: "이미 청구된 회차입니다.",
          provider: "tosspayments",
          orderId,
        });
        continue;
      }

      if (!subscription.billing_key || !subscription.customer_key) {
        results.push({
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          success: false,
          message: "토스 청구에 필요한 billing_key/customer_key가 없습니다.",
          provider: "tosspayments",
          orderId,
        });
        continue;
      }

      const tossRes = await tossCharge({
        encodedKey: encodedTossKey,
        billingKey: subscription.billing_key,
        customerKey: subscription.customer_key,
        amount: plan.amount,
        orderId,
        orderName: plan.orderName,
      });

      if (!tossRes.ok) {
        console.error("billing charge failed:", tossRes.json);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "past_due",
            raw_payload: tossRes.json,
            updated_at: nowIso,
          })
          .eq("id", subscription.id);

        results.push({
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          success: false,
          message: tossRes.json?.message || "자동청구 실패",
          provider: "tosspayments",
          orderId,
        });
        continue;
      }

      const approvedAt =
        tossRes.json?.approvedAt ||
        tossRes.json?.requestedAt ||
        new Date().toISOString();

      // ✅ 유료 기간 계산: next_billing_at 기준으로 1개월/1년 연장
      const currentPeriodStartDate = periodBase;
      const currentPeriodEndDate =
        plan.interval === "year"
          ? addYears(periodBase, 1)
          : addMonths(periodBase, 1);

      const currentPeriodStart = currentPeriodStartDate.toISOString();
      const currentPeriodEnd = currentPeriodEndDate.toISOString();

      // payments 저장 (네 스키마 유지)
      const { error: paymentInsertError } = await supabaseAdmin
        .from("payments")
        .insert({
          user_id: subscription.user_id,
          order_id: orderId,
          payment_key: tossRes.json?.paymentKey ?? null,
          provider: "tosspayments",
          method: tossRes.json?.method ?? "CARD",
          amount: plan.amount,
          currency: "KRW",
          status: "DONE",
          payment_type: "subscription",
          plan_code: plan.plan_code,
          paid_at: approvedAt,
          approved_at: approvedAt,
          raw_payload: tossRes.json,
        });

      if (paymentInsertError) {
        console.error("paymentInsertError:", paymentInsertError);

        results.push({
          userId: subscription.user_id,
          subscriptionId: subscription.id,
          success: false,
          message: "payments 저장 실패",
          provider: "tosspayments",
          orderId,
        });
        continue;
      }

      // subscriptions 갱신 (trial → active 전환 포함)
      const { error: subscriptionUpdateError } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          next_billing_at: currentPeriodEnd,
          raw_payload: tossRes.json,
          updated_at: nowIso,
        })
        .eq("id", subscription.id);

      if (subscriptionUpdateError) {
        console.error("subscriptionUpdateError:", subscriptionUpdateError);
      }

      // profiles 연장
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({
          is_premium: true,
          premium_plan: plan.plan_code,
          premium_updated_at: nowIso,
          premium_expires_at: currentPeriodEnd,
        })
        .eq("id", subscription.user_id);

      if (profileUpdateError) {
        console.error("profileUpdateError:", profileUpdateError);
      }

      results.push({
        userId: subscription.user_id,
        subscriptionId: subscription.id,
        success: true,
        message:
          subscription.status === "trial"
            ? "무료기간 종료 → 첫 유료 청구 성공"
            : "자동청구 성공",
        provider: "tosspayments",
        orderId,
      });
    } catch (error) {
      console.error("charge loop error:", error);

      results.push({
        userId: subscription.user_id,
        subscriptionId: subscription.id,
        success: false,
        message: "예외 발생",
        provider: subscription.provider,
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: "자동청구 작업이 완료되었습니다.",
    chargedCount: results.filter((r) => r.success).length,
    results,
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, message: "권한이 없습니다." },
      { status: 401 }
    );
  }
  return runCharge();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, message: "권한이 없습니다." },
      { status: 401 }
    );
  }
  return runCharge();
}
