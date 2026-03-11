"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type SubscriptionRow = {
  id: string;
  provider?: string | null;
  status: string | null; // 예: trial | active | past_due | cancelled ...
  plan_code: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_at: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
};

function getPlanLabel(planCode: string | null) {
  if (planCode === "premium_monthly") return "골드 멤버십 월 정기결제";
  if (planCode === "premium_yearly") return "골드 멤버십 연 정기결제";
  return "프리미엄 멤버십";
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}

function isFuture(value: string | null) {
  if (!value) return false;
  return new Date(value).getTime() > Date.now();
}

export default function MySubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);

  const cancelScheduled = useMemo(() => {
    if (!subscription) return false;
    // cancel_at이 미래면 “해지 예약 중”
    return isFuture(subscription.cancel_at);
  }, [subscription]);

  const statusLabel = useMemo(() => {
    if (!subscription) return "상태 확인 필요";

    // ✅ 정책: status를 cancelled로 즉시 바꾸지 않아도, cancel_at이 있으면 해지 예약으로 표시
    if (cancelScheduled) return "해지 예약됨";

    if (subscription.status === "trial") return "무료 이용 중";
    if (subscription.status === "active") return "이용 중";
    if (subscription.status === "past_due") return "결제 재시도 필요";
    if (subscription.status === "cancelled") return "해지됨";

    return "상태 확인 필요";
  }, [subscription, cancelScheduled]);

  const statusBadgeClass = useMemo(() => {
    if (!subscription) return "border border-white/10 bg-white/5 text-white/70";

    if (cancelScheduled) {
      return "border border-red-400/30 bg-red-500/10 text-red-300";
    }

    if (subscription.status === "trial") {
      return "border border-[#d4af37]/30 bg-[#d4af37]/12 text-[#f1d17a]";
    }

    if (subscription.status === "active") {
      return "border border-[#d4af37]/30 bg-[#d4af37]/15 text-[#f1d17a]";
    }

    if (subscription.status === "past_due") {
      return "border border-yellow-400/30 bg-yellow-500/10 text-yellow-300";
    }

    if (subscription.status === "cancelled") {
      return "border border-white/10 bg-white/5 text-white/70";
    }

    return "border border-white/10 bg-white/5 text-white/70";
  }, [subscription, cancelScheduled]);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select(
          "id, provider, status, plan_code, current_period_start, current_period_end, next_billing_at, cancel_at, canceled_at"
        )
        .eq("user_id", user.id)
        .eq("provider", "tosspayments")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(error);
        setSubscription(null);
        return;
      }

      setSubscription((data as SubscriptionRow | null) ?? null);
    } catch (error) {
      console.error(error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  const handleCancel = async () => {
    if (!subscription) return;

    if (cancelScheduled) {
      toast("이미 해지 예약이 되어 있습니다.");
      return;
    }

    const ok = confirm(
      "구독을 해지하면 기간 종료일까지는 사용 가능하고, 이후 자동 해지됩니다. 진행할까요?"
    );
    if (!ok) return;

    try {
      setCanceling(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("로그인 상태를 다시 확인해주세요.");
        return;
      }

      // ✅ 우리가 만든 Cancel API 경로로 고정
      const res = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(json?.message || "구독 해지에 실패했습니다.");
        return;
      }

      toast.success(json?.message || "해지 예약이 완료되었습니다.");
      await loadSubscription();
    } catch (error) {
      console.error(error);
      toast.error("구독 해지 중 오류가 발생했습니다.");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f1d17a]/70">
            My Subscription
          </p>
          <h1 className="mt-4 text-3xl font-bold text-[#f1d17a]">구독 관리</h1>

          {loading ? (
            <p className="mt-6 text-white/60">불러오는 중...</p>
          ) : !subscription ? (
            <div className="mt-6">
              <p className="text-white/60">현재 구독 정보가 없습니다.</p>
              <Link
                href="/premium"
                className="mt-6 inline-block rounded-xl bg-[#d4af37] px-6 py-3 font-bold text-[#11182b] hover:brightness-110"
              >
                프리미엄 가입하러 가기
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/12 px-4 py-2 text-sm font-semibold text-[#f1d17a]">
                  👑 {getPlanLabel(subscription.plan_code)}
                </div>

                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${statusBadgeClass}`}
                >
                  {statusLabel}
                </div>
              </div>

              {cancelScheduled && (
                <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-200">
                    해지 예약됨
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    해지 예정일:{" "}
                    <span className="font-semibold text-white">
                      {formatDate(subscription.cancel_at)}
                    </span>
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-[#0f1526] p-4">
                  <p className="text-sm text-white/50">멤버십 플랜</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {getPlanLabel(subscription.plan_code)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#0f1526] p-4">
                  <p className="text-sm text-white/50">구독 상태</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {statusLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#0f1526] p-4">
                  <p className="text-sm text-white/50">현재 이용 종료일</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#0f1526] p-4">
                  <p className="text-sm text-white/50">다음 결제일</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {formatDate(subscription.next_billing_at)}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/payment"
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white/80 hover:bg-white/10"
                >
                  결제내역 보기
                </Link>

                <button
                  onClick={handleCancel}
                  disabled={canceling || cancelScheduled}
                  className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-3 font-semibold text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {canceling
                    ? "해지 처리 중..."
                    : cancelScheduled
                    ? "해지 예약됨"
                    : "구독 해지하기"}
                </button>
              </div>

              <div className="mt-8 rounded-2xl border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))] p-5">
                <p className="text-sm text-white/70">
                  구독을 해지하면 다음 결제부터 자동청구가 중지되고, 현재 결제된
                  기간 끝까지는 프리미엄 이용이 유지됩니다.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
