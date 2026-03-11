"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { checkLottoResult } from "@/lib/lottoResult";
import { LottoDraw } from "@/types/lotto";

type MyLottoRow = {
  id: string;
  numbers: number[];
  created_at: string;
};

function getRankBadgeColor(rankLabel: string) {
  switch (rankLabel) {
    case "1등":
      return "bg-yellow-400 text-[#11182b]";
    case "2등":
      return "bg-sky-400 text-[#11182b]";
    case "3등":
      return "bg-green-400 text-[#11182b]";
    case "4등":
      return "bg-purple-400 text-white";
    case "5등":
      return "bg-orange-400 text-[#11182b]";
    default:
      return "bg-white/10 text-white/70";
  }
}

function formatCreatedAt(value: string) {
  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

export default function MyLottoPage() {
  const [savedSets, setSavedSets] = useState<MyLottoRow[]>([]);
  const [latestDraw, setLatestDraw] = useState<LottoDraw | null>(null);
  const [loadingSavedSets, setLoadingSavedSets] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/lotto/latest", { cache: "no-store" });
        const data = (await res.json()) as LottoDraw;
        setLatestDraw(data);
      } catch {
        setLatestDraw(null);
      }
    };

    const fetchSavedSets = async () => {
      try {
        setLoadingSavedSets(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setSavedSets([]);
          return;
        }

        const { data, error } = await supabase
          .from("my_lotto")
          .select("id, numbers, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error(error);
          toast.error("MY 로또를 불러오지 못했습니다.");
          setSavedSets([]);
          return;
        }

        setSavedSets((data as MyLottoRow[]) ?? []);
      } catch (error) {
        console.error(error);
        toast.error("MY 로또 조회 중 오류가 발생했습니다.");
        setSavedSets([]);
      } finally {
        setLoadingSavedSets(false);
      }
    };

    fetchLatest();
    fetchSavedSets();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      const { error } = await supabase.from("my_lotto").delete().eq("id", id);

      if (error) {
        toast.error("삭제에 실패했습니다.");
        return;
      }

      setSavedSets((prev) => prev.filter((item) => item.id !== id));
      toast.success("저장된 조합이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (numbers: number[]) => {
    try {
      await navigator.clipboard.writeText(numbers.join(", "));
      toast.success("조합이 복사되었습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d17a]/70">
            My Lotto
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#f1d17a]">
            저장한 조합
          </h1>
          <p className="mt-3 text-sm text-white/60">
            저장한 추천 조합을 최신 당첨번호와 자동 비교합니다.
          </p>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-bold text-[#f1d17a]">
            최신 당첨번호
          </h2>

          {!latestDraw ? (
            <p className="text-white/50">최신 회차를 불러오는 중입니다.</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-white/60">
                제 {latestDraw.round}회 · {latestDraw.drawDate}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {latestDraw.numbers.map((num) => (
                  <div
                    key={num}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d4af37] font-bold text-[#11182b]"
                  >
                    {num}
                  </div>
                ))}

                <span className="mx-1 text-xl font-bold text-[#d4af37]">+</span>

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-400 font-bold text-white">
                  {latestDraw.bonus}
                </div>
              </div>
            </>
          )}
        </div>

        {loadingSavedSets ? (
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8 text-center shadow-xl">
            <p className="text-white/60">MY 로또를 불러오는 중입니다.</p>
          </div>
        ) : savedSets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8 text-center shadow-xl">
            <p className="text-white/60">아직 저장한 조합이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedSets.map((item, index) => {
              const result = latestDraw
                ? checkLottoResult(item.numbers, latestDraw)
                : null;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#f1d17a]">
                        저장 조합 {index + 1}
                      </p>
                      <p className="text-xs text-white/50">
                        저장일 {formatCreatedAt(item.created_at)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(item.numbers)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                      >
                        복사
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === item.id ? "삭제 중..." : "삭제"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.numbers.map((num) => {
                      const matched =
                        result?.matchedNumbers.includes(num) ||
                        (latestDraw?.bonus === num && result?.bonusMatched);

                      return (
                        <div
                          key={num}
                          className={`flex h-11 w-11 items-center justify-center rounded-full font-bold ${
                            matched
                              ? "bg-green-400 text-[#11182b]"
                              : "bg-[#d4af37] text-[#11182b]"
                          }`}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>

                  {result && (
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-[#0f1526] p-4">
                        <p className="text-xs text-white/50">맞은 개수</p>
                        <p className="mt-2 text-lg font-bold text-white">
                          {result.matchCount}개
                        </p>
                      </div>

                      <div className="rounded-2xl bg-[#0f1526] p-4">
                        <p className="text-xs text-white/50">맞은 번호</p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {result.matchedNumbers.length > 0
                            ? result.matchedNumbers.join(", ")
                            : "없음"}
                        </p>
                        {result.bonusMatched && (
                          <p className="mt-1 text-xs text-[#f1d17a]">
                            보너스 번호 일치
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl bg-[#0f1526] p-4">
                        <p className="text-xs text-white/50">결과</p>
                        <div
                          className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${getRankBadgeColor(
                            result.rankLabel
                          )}`}
                        >
                          {result.rankLabel}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}