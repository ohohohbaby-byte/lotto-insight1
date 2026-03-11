"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import AnalysisTabs from "@/components/AnalysisTabs";
import NumberHeatmap from "@/components/NumberHeatmap";
import AdBanner from "@/components/AdBanner";
import { LottoDraw } from "@/types/lotto";
import { buildLottoStats } from "@/lib/lottoStats";
import { getLottoBallColor } from "@/lib/lottoColor";
import { getAdminDraws } from "@/lib/clientLottoStorage";

type HomeDashboardProps = {
  initialDraws: LottoDraw[];
};

function mergeDraws(baseDraws: LottoDraw[], adminDraws: LottoDraw[]): LottoDraw[] {
  const map = new Map<number, LottoDraw>();

  for (const draw of baseDraws) {
    map.set(draw.round, draw);
  }

  for (const draw of adminDraws) {
    map.set(draw.round, draw);
  }

  return Array.from(map.values()).sort((a, b) => b.round - a.round);
}

export default function HomeDashboard({ initialDraws }: HomeDashboardProps) {
  const [adminDraws, setAdminDraws] = useState<LottoDraw[]>([]);

  useEffect(() => {
    setAdminDraws(getAdminDraws());

    const handleFocus = () => {
      setAdminDraws(getAdminDraws());
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const mergedDraws = useMemo(
    () => mergeDraws(initialDraws, adminDraws),
    [initialDraws, adminDraws]
  );

  const recentDraws = useMemo(() => mergedDraws.slice(0, 10), [mergedDraws]);
  const latestDraw = mergedDraws[0] ?? null;
  const stats = buildLottoStats(recentDraws);

  const winningNumbers = latestDraw?.numbers ?? [4, 25, 31, 38, 40, 45];
  const bonusNumber = latestDraw?.bonus ?? 6;
  const currentRound = latestDraw?.round ?? 1126;
  const drawDate = latestDraw?.drawDate ?? "2024-06-29";

  const odd = stats.oddEven.odd;
  const even = stats.oddEven.even;
  const oddPercent = odd + even > 0 ? Math.round((odd / (odd + even)) * 100) : 50;

  const high = stats.highLow.high;
  const low = stats.highLow.low;
  const highPercent = high + low > 0 ? Math.round((high / (high + low)) * 100) : 50;

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,#18233f,#0b1020_70%)] p-8 shadow-2xl">
          <div className="mx-auto max-w-3xl rounded-3xl border border-[#d4af37]/20 bg-black/20 px-8 py-10 text-center backdrop-blur-sm">
            <p className="mb-3 text-lg text-white/70">제 {currentRound}회 당첨번호</p>

            <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
              {winningNumbers.map((num) => (
                <div
                  key={num}
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold shadow-lg ${getLottoBallColor(
                    num
                  )}`}
                >
                  {num}
                </div>
              ))}

              <span className="mx-1 text-2xl font-bold text-[#d4af37]">+</span>

              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold shadow-lg ${getLottoBallColor(
                  bonusNumber
                )}`}
              >
                {bonusNumber}
              </div>
            </div>

            <p className="text-xl text-white/80">
              최근 추첨일:
              <span className="font-bold text-[#d4af37]"> {drawDate}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-6">
        <AdBanner height={120} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 lg:grid-cols-[380px_1fr]">
        <AnalysisTabs draws={recentDraws} />

        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[#d4af37]">♪</span>
              <h3 className="text-lg font-bold text-[#f1d17a]">
                번호별 출현 빈도 (최근 {stats.totalDraws}회)
              </h3>
            </div>

            <div className="flex h-52 items-end justify-between gap-3 rounded-2xl bg-[#0f1526] p-4">
              {stats.topFrequencies.map((item) => {
                const maxCount = stats.topFrequencies[0]?.count ?? 1;
                const height = Math.max(20, Math.round((item.count / maxCount) * 100));

                return (
                  <div
                    key={item.number}
                    className="flex flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="text-xs text-white/50">{item.count}</div>
                    <div
                      className="w-full rounded-t-md bg-[#d4af37]"
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-xs font-semibold text-[#f1d17a]">
                      {item.number}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[#d4af37]">◔</span>
                <h3 className="text-lg font-bold text-[#f1d17a]">홀짝 비율</h3>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className="h-32 w-32 rounded-full"
                  style={{
                    background: `conic-gradient(#d4af37 0% ${oddPercent}%, #4a6b95 ${oddPercent}% 100%)`,
                  }}
                >
                  <div className="m-[14px] h-[100px] w-[100px] rounded-full bg-[#131a2d]" />
                </div>
                <p className="mt-4 text-white/70">홀 {odd} / 짝 {even}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[#d4af37]">◑</span>
                <h3 className="text-lg font-bold text-[#f1d17a]">고저 비율</h3>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className="h-32 w-32 rounded-full"
                  style={{
                    background: `conic-gradient(#d4af37 0% ${highPercent}%, #4a6b95 ${highPercent}% 100%)`,
                  }}
                >
                  <div className="m-[14px] h-[100px] w-[100px] rounded-full bg-[#131a2d]" />
                </div>
                <p className="mt-4 text-white/70">고 {high} / 저 {low}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[#d4af37]">◉</span>
              <h3 className="text-lg font-bold text-[#f1d17a]">최근 미출현 번호</h3>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-sm md:grid-cols-6">
              {stats.recentMissingNumbers.map((num) => (
                <div
                  key={num}
                  className="rounded-xl bg-[#0f1526] px-4 py-4 font-semibold text-[#f1d17a]"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          <NumberHeatmap draws={recentDraws} />

          <AdBanner height={160} />
        </div>
      </section>
    </main>
  );
}