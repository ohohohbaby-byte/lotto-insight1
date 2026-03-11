"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      payment: (params: { customerKey: string }) => {
        requestBillingAuth: (params: {
          method: "CARD" | "TRANSFER";
          successUrl: string;
          failUrl: string;
          customerName?: string;
          customerEmail?: string;
          windowTarget?: "self" | "iframe";
        }) => Promise<void>;
      };
    };
  }
}

export default function PremiumPage() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  const NAVER_PAY_READY = false;
  const KAKAO_PAY_READY = false;

  const loadStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoggedIn(false);
        setIsPremium(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      if (error) {
        setIsPremium(false);
        return;
      }

      setIsPremium(!!profile?.is_premium);
    } catch (error) {
      console.error(error);
      setIsLoggedIn(false);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleCardSubscription = async () => {
    try {
      if (!isLoggedIn) {
        toast.error("로그인 후 이용할 수 있습니다.");
        window.location.href = "/login";
        return;
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

      if (!clientKey || !siteUrl) {
        toast.error("결제 환경변수를 확인해주세요.");
        return;
      }

      if (typeof window === "undefined" || !window.TossPayments) {
        toast.error("토스 결제 SDK가 아직 로드되지 않았습니다.");
        return;
      }

      setBillingLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("로그인 상태를 다시 확인해주세요.");
        return;
      }

      const tossPayments = window.TossPayments(clientKey);
      const payment = tossPayments.payment({
        customerKey: user.id,
      });

      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: `${siteUrl}/payment/success`,
        failUrl: `${siteUrl}/payment/fail`,
        customerName: user.user_metadata?.name || "LOTTO INSIGHT 회원",
        customerEmail: user.email || undefined,
        windowTarget: "self",
      });
    } catch (error) {
      console.error(error);
      toast.error("카드 자동결제 등록 중 오류가 발생했습니다.");
    } finally {
      setBillingLoading(false);
    }
  };

  const handleNaverPaySubscription = () => {
    if (!NAVER_PAY_READY) {
      toast("네이버페이 자동결제는 제휴 완료 후 오픈됩니다.");
      return;
    }
    toast("네이버페이 자동결제 연동 준비 중입니다.");
  };

  const handleKakaoPaySubscription = () => {
    if (!KAKAO_PAY_READY) {
      toast("카카오페이 정기결제는 제휴 완료 후 오픈됩니다.");
      return;
    }
    toast("카카오페이 정기결제 연동 준비 중입니다.");
  };

  return (
    <main className="min-h-screen bg-[#091224] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_35%)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-sm font-semibold text-[#f1d17a]">
                <span>👑</span>
                <span>GOLD MEMBERSHIP</span>
              </div>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white md:text-6xl">
                로또 분석의 상위 등급
                <br />
                <span className="text-[#f1d17a]">골드 멤버십</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                AI 패턴 분석, 상위 추천 조합 전체 공개, 프리미엄 전용 분석 화면까지
                포함된 월 정기결제 멤버십입니다.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-[#11182b] px-4 py-3 text-sm text-white/80">
                  매월 9,900원
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#11182b] px-4 py-3 text-sm text-white/80">
                  언제든 해지 가능
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#11182b] px-4 py-3 text-sm text-white/80">
                  첫 등록 후 자동 갱신
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.16),rgba(255,255,255,0.03))] p-6 shadow-2xl">
              <div className="rounded-3xl border border-white/10 bg-[#0f1526] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#f1d17a]">
                      GOLD 멤버십 월 정기결제
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white">
                      월 9,900원
                    </h2>
                  </div>

                  <div className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-bold text-[#11182b]">
                    추천
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm text-white/75">
                  <div className="flex items-center gap-3">
                    <span className="text-[#f1d17a]">✔</span>
                    상위 추천 조합 전체 공개
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#f1d17a]">✔</span>
                    고급 패턴 분석 점수 확인
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#f1d17a]">✔</span>
                    프리미엄 전용 분석 화면 제공
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#f1d17a]">✔</span>
                    취소 전까지 매월 자동 결제
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-[#131a2d] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#f1d17a]/70">
                    Current Status
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    {loading
                      ? "회원 상태 확인 중..."
                      : !isLoggedIn
                      ? "비로그인 상태입니다."
                      : isPremium
                      ? "현재 프리미엄 회원입니다."
                      : "현재 일반회원입니다."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-[28px] border border-white/10 bg-[#10182b] p-6 shadow-xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="text-[#f1d17a]">✨</span>
            <h3 className="text-2xl font-bold text-white">
              결제수단을 선택해주세요
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <button
              onClick={handleCardSubscription}
              disabled={loading || billingLoading}
              className="group rounded-3xl border border-[#d4af37]/25 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))] p-6 text-left transition hover:border-[#d4af37]/50 hover:bg-[linear-gradient(135deg,rgba(212,175,55,0.18),rgba(255,255,255,0.04))] disabled:opacity-60"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-[#d4af37] px-3 py-3 text-lg text-[#11182b]">
                  💳
                </div>
                <span className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-bold text-[#11182b]">
                  즉시 가능
                </span>
              </div>

              <h4 className="mt-5 text-xl font-bold text-white">
                카드 자동결제
              </h4>
              <p className="mt-2 text-sm leading-6 text-white/70">
                카드 등록 후 매월 자동 청구됩니다.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0f1526] px-4 py-3 text-sm font-semibold text-[#f1d17a]">
                {billingLoading
                  ? "등록창 준비 중..."
                  : "카드로 골드 멤버십 시작하기"}
              </div>
            </button>

            <button
              onClick={handleNaverPaySubscription}
              className="group rounded-3xl border border-white/10 bg-[#131a2d] p-6 text-left transition hover:border-white/20 hover:bg-[#172038]"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-white px-3 py-3 text-lg text-[#03c75a]">
                  N
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/70">
                  준비중
                </span>
              </div>

              <h4 className="mt-5 text-xl font-bold text-white">
                네이버페이 자동결제
              </h4>
              <p className="mt-2 text-sm leading-6 text-white/70">
                제휴 완료 후 같은 상품으로 확장 가능합니다.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0f1526] px-4 py-3 text-sm font-semibold text-white/70">
                네이버페이 자동결제 준비중
              </div>
            </button>

            <button
              onClick={handleKakaoPaySubscription}
              className="group rounded-3xl border border-white/10 bg-[#131a2d] p-6 text-left transition hover:border-white/20 hover:bg-[#172038]"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-[#fee500] px-3 py-3 text-lg text-[#11182b]">
                  💬
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/70">
                  준비중
                </span>
              </div>

              <h4 className="mt-5 text-xl font-bold text-white">
                카카오페이 정기결제
              </h4>
              <p className="mt-2 text-sm leading-6 text-white/70">
                제휴 완료 후 같은 상품으로 확장 가능합니다.
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[#0f1526] px-4 py-3 text-sm font-semibold text-white/70">
                카카오페이 정기결제 준비중
              </div>
            </button>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-[#0d1425] p-6">
            <h4 className="text-lg font-bold text-[#f1d17a]">안내</h4>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-white/65">
              <li>• 본 상품은 월 정기결제 상품입니다.</li>
              <li>• 결제수단 등록 후 취소 전까지 매월 자동 결제됩니다.</li>
              <li>• 카드 자동결제는 현재 바로 연결 가능합니다.</li>
              <li>• 네이버페이/카카오페이 정기결제는 별도 계약 및 심사 후 활성화가 필요합니다.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}