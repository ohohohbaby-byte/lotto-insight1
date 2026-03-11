"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type PremiumModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PremiumModal({
  isOpen,
  onClose,
}: PremiumModalProps) {
  const router = useRouter();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserStatus = async () => {
      if (!isOpen) return;

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

        const { data } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        setIsPremium(!!data?.is_premium);
      } catch {
        setIsLoggedIn(false);
        setIsPremium(false);
      }
    };

    loadUserStatus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrimaryAction = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (!isLoggedIn) {
        onClose();
        router.push("/login");
        return;
      }

      if (isPremium) {
        onClose();
        router.push("/");
        return;
      }

      // 나중에 실제 결제/구독 페이지로 연결
      // 예: router.push("/premium")
      onClose();
router.push("/premium");
    } finally {
      setLoading(false);
    }
  };

  const primaryLabel = !isLoggedIn
    ? "로그인하고 프리미엄 보기"
    : isPremium
    ? "프리미엄 이용 중"
    : "프리미엄 신청하기";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-[#d4af37]/20 bg-[#11182b] shadow-2xl">
        <div className="relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(212,175,55,0.18),rgba(255,255,255,0.03))] p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg border border-white/10 px-3 py-1 text-sm text-white/60 hover:bg-white/5 hover:text-white"
          >
            닫기
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d17a]/70">
            Premium Membership
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#f1d17a]">
            프리미엄 분석을 열어보세요
          </h2>

          <p className="mt-3 max-w-xl text-sm text-white/75">
            무료 추천보다 더 깊은 데이터 기반 분석으로 상위 조합을 선별합니다.
            미출현 패턴, 출현 빈도, 분산 점수, 합계 균형까지 반영한 추천을 제공합니다.
          </p>
        </div>

        <div className="p-6">
          <div className="mb-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0f1526] p-4">
              <p className="text-sm font-bold text-[#f1d17a]">
                프리미엄에서 가능한 것
              </p>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                <p>• 상위 추천 조합 전체 공개</p>
                <p>• 출현 빈도 기반 점수 정렬</p>
                <p>• 최근 미출현 번호 점수 반영</p>
                <p>• 홀짝 / 고저 / 합계 밸런스 분석</p>
                <p>• 번호 분산 / 끝수 분산 분석</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))] p-4">
              <p className="text-sm font-bold text-[#f1d17a]">
                이런 분께 추천합니다
              </p>
              <div className="mt-3 space-y-2 text-sm text-white/70">
                <p>• 매주 조합을 체계적으로 관리하고 싶은 분</p>
                <p>• 단순 랜덤보다 분석형 추천을 원하는 분</p>
                <p>• MY 로또와 함께 고급 추천까지 쓰고 싶은 분</p>
                <p>• 프리미엄 조합을 맛보기 이상으로 확인하고 싶은 분</p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-[#d4af37]/20 bg-[#0f1526] p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-white/60">예상 멤버십 요금</p>
                <p className="mt-1 text-3xl font-bold text-[#f1d17a]">
                  월 9,900원
                </p>
                <p className="mt-2 text-xs text-white/50">
                  실제 결제 기능은 다음 단계에서 연결 예정입니다.
                </p>
              </div>

              <div className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold text-[#f1d17a]">
                {isPremium
                  ? "PREMIUM ACTIVE"
                  : !isLoggedIn
                  ? "LOGIN REQUIRED"
                  : "UPGRADE AVAILABLE"}
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-white/10 bg-[#0f1526] p-4">
            <p className="text-sm font-bold text-[#f1d17a]">지금 상태</p>
            <p className="mt-2 text-sm text-white/70">
              {!isLoggedIn
                ? "현재 비로그인 상태입니다. 로그인 후 더 많은 프리미엄 조합을 확인할 수 있습니다."
                : isPremium
                ? "현재 프리미엄 회원 상태입니다. 전체 프리미엄 조합을 확인할 수 있습니다."
                : "현재 일반회원 상태입니다. 일부 프리미엄 조합만 미리 보기로 제공됩니다."}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              onClick={handlePrimaryAction}
              disabled={loading || isPremium}
              className="flex-1 rounded-xl bg-[#d4af37] px-4 py-3 font-bold text-[#11182b] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "처리 중..." : primaryLabel}
            </button>

            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white/80 hover:bg-white/10"
            >
              나중에 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}