"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NumberGenerator from "@/components/NumberGenerator";
import PremiumPreview from "@/components/PremiumPreview";
import PremiumModal from "@/components/PremiumModal";
import { LottoDraw } from "@/types/lotto";

type AnalysisTabsProps = {
  draws: LottoDraw[];
};

export default function AnalysisTabs({ draws }: AnalysisTabsProps) {
  const [tab, setTab] = useState<"free" | "premium">("free");
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadUserStatus = async () => {
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

        const { data, error } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        if (error) {
          setIsPremium(false);
          return;
        }

        setIsPremium(!!data?.is_premium);
      } catch {
        setIsLoggedIn(false);
        setIsPremium(false);
      }
    };

    loadUserStatus();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-[#131a2d] shadow-xl">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setTab("free")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
              tab === "free"
                ? "bg-[#0f1526] text-[#f1d17a]"
                : "text-white/60 hover:bg-white/5"
            }`}
          >
            무료 추천
          </button>

          <button
            onClick={() => setTab("premium")}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
              tab === "premium"
                ? "bg-[#0f1526] text-[#f1d17a]"
                : "text-white/60 hover:bg-white/5"
            }`}
          >
            프리미엄 분석 {!isPremium && "🔒"}
          </button>
        </div>

        <div className="p-6">
          {tab === "free" && <NumberGenerator />}

          {tab === "premium" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#d4af37]/30 bg-[#0f1526] p-6 text-center">
                <h3 className="mb-2 text-xl font-bold text-[#f1d17a]">
                  프리미엄 분석 기능
                </h3>

                <p className="mb-2 text-sm text-white/70">
                  데이터 기반 점수 분석으로 조합을 추천합니다.
                </p>

                <p className="text-xs text-[#f1d17a]/80">
                  {!isLoggedIn
                    ? "비로그인 사용자는 일부 조합만 미리 볼 수 있습니다."
                    : isPremium
                    ? "프리미엄 회원은 전체 상위 조합을 모두 확인할 수 있습니다."
                    : "일반회원은 일부 조합만 미리 볼 수 있으며, 나머지는 프리미엄 전용입니다."}
                </p>

                {!isPremium && (
                  <button
                    onClick={() => setIsPremiumModalOpen(true)}
                    className="mt-4 rounded-xl bg-[#d4af37] px-6 py-3 font-semibold text-[#11182b] hover:brightness-110"
                  >
                    {!isLoggedIn ? "로그인하고 더 보기" : "프리미엄 안내 보기"}
                  </button>
                )}
              </div>

              <PremiumPreview draws={draws} />
            </div>
          )}
        </div>
      </div>

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
    </>
  );
}