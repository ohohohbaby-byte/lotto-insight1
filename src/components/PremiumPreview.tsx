"use client";

import { useEffect, useState } from "react";
import { generatePremiumTopSets } from "@/lib/premiumEngine";
import { LottoDraw } from "@/types/lotto";
import { getLottoBallColor } from "@/lib/lottoColor";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type PremiumPreviewProps = {
  draws: LottoDraw[];
};

export default function PremiumPreview({ draws }: PremiumPreviewProps) {
  const rankedSets = generatePremiumTopSets(draws, 300, 10);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const loadUserStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoggedIn(false);
          setIsPremium(false);
          setAuthChecked(true);
          return;
        }

        setIsLoggedIn(true);

        const { data, error } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        if (error) {
          setIsPremium(false);
          setAuthChecked(true);
          return;
        }

        setIsPremium(!!data?.is_premium);
        setAuthChecked(true);
      } catch {
        setIsLoggedIn(false);
        setIsPremium(false);
        setAuthChecked(true);
      }
    };

    loadUserStatus();
  }, []);

  const visibleCount = !isLoggedIn ? 1 : isPremium ? 10 : 3;

  const handleUpgradeClick = async () => {
    if (!authChecked) return;

    if (!isLoggedIn) {
      toast.error("로그인 후 더 많은 프리미엄 조합을 볼 수 있습니다.");
      window.location.href = "/login";
      return;
    }

    if (!isPremium) {
      toast("프리미엄 구독 시 전체 상위 조합을 확인할 수 있습니다.");
      return;
    }

    toast.success("프리미엄 기능이 활성화되어 있습니다.");
  };

  return (
    <div className="rounded-3xl border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))] p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d17a]/70">
            Premium Preview
          </p>
          <h3 className="mt-1 text-xl font-bold text-[#f1d17a]">
            데이터 기반 상위 추천 조합
          </h3>
        </div>

        <span className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-bold text-[#11182b]">
          VIP
        </span>
      </div>

      <p className="mb-2 text-sm text-white/70">
        최근 회차 통계를 기반으로 후보 조합을 대량 생성한 뒤, 분석 점수가 높은 조합만 선별합니다.
      </p>

      <p className="mb-5 text-xs text-[#f1d17a]/80">
        {!isLoggedIn
          ? "비로그인 사용자는 1개 조합만 미리 볼 수 있습니다."
          : isPremium
          ? "프리미엄 회원은 전체 상위 조합을 모두 볼 수 있습니다."
          : "일반회원은 3개 조합까지 미리 볼 수 있습니다."}
      </p>

      <div className="space-y-4">
        {rankedSets.map((item, index) => {
          const locked = index >= visibleCount;

          return (
            <div
              key={`${item.numbers.join("-")}-${index}`}
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#11182b]/70 p-4 ${
                locked ? "opacity-70" : ""
              }`}
            >
              {locked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b1020]/75 backdrop-blur-[3px]">
                  <div className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-2 text-sm font-semibold text-[#f1d17a]">
                    🔒 {!isLoggedIn ? "로그인 후 더 보기" : "프리미엄 전용 조합"}
                  </div>

                  <p className="max-w-sm text-center text-sm text-white/70">
                    {!isLoggedIn
                      ? "로그인하면 더 많은 프리미엄 조합을 확인할 수 있습니다."
                      : "프리미엄 구독 시 상위 추천 조합 전체와 분석 점수를 모두 볼 수 있습니다."}
                  </p>

                  <button
                    onClick={handleUpgradeClick}
                    className="rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-bold text-[#11182b] hover:brightness-110"
                  >
                    {!isLoggedIn ? "로그인하고 더 보기" : "프리미엄 전체 열기"}
                  </button>
                </div>
              )}

              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#f1d17a]">
                    프리미엄 조합 {index + 1}
                  </p>
                  <p className="text-xs text-white/50">
                    분석 점수 {item.analysis.totalScore}점
                  </p>
                </div>

                <div className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold text-[#f1d17a]">
                  SCORE {item.analysis.totalScore}
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {item.numbers.map((num) => (
                  <div
                    key={num}
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${getLottoBallColor(
                      num
                    )}`}
                  >
                    {num}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-white/70 md:grid-cols-3">
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  출현 빈도 {item.analysis.frequencyScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  미출현 점수 {item.analysis.recentMissScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  홀짝 균형 {item.analysis.oddEvenScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  고저 균형 {item.analysis.highLowScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  합계 점수 {item.analysis.sumScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  연속 패턴 {item.analysis.consecutiveScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  구간 분산 {item.analysis.spreadScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  끝수 분산 {item.analysis.endDigitScore}
                </div>
                <div className="rounded-lg bg-white/5 px-3 py-2">
                  과몰림 방지 {item.analysis.crowdPenaltyScore}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#0f1526] p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-lg font-bold text-[#f1d17a]">프리미엄 멤버십</h4>
            <p className="text-sm text-white/60">
              전체 상위 조합, 고급 분석 점수, 추가 패턴 필터 제공
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-white/50">예상 요금</p>
            <p className="text-xl font-bold text-[#f1d17a]">월 9,900원</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-white/70 md:grid-cols-2">
          <p>• 상위 10개 전체 조합 공개</p>
          <p>• 최근 미출현 번호 점수 강화</p>
          <p>• 출현 빈도 기반 추천 정렬</p>
          <p>• 고급 패턴 점수 분석 제공</p>
        </div>

        <button
          onClick={handleUpgradeClick}
          className="mt-4 w-full rounded-xl bg-[#d4af37] px-4 py-3 font-bold text-[#11182b] hover:brightness-110"
        >
          {!isLoggedIn
            ? "로그인하고 더 보기"
            : isPremium
            ? "프리미엄 이용 중"
            : "프리미엄 전체 조합 보기"}
        </button>
      </div>
    </div>
  );
}