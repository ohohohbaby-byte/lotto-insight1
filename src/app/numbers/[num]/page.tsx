import type { Metadata } from "next";
import AdBanner from "@/components/AdBanner";
import { getRecentLottoDraws } from "@/lib/lottoApi";
import { getLottoBallColor } from "@/lib/lottoColor";
import { buildLottoStats } from "@/lib/lottoStats";

type Props = {
  params: Promise<{
    num: string;
  }>;
};

function countNumberHits(
  draws: Awaited<ReturnType<typeof getRecentLottoDraws>>,
  target: number
) {
  return draws.filter((draw) => draw.numbers.includes(target)).length;
}

function getHitRounds(
  draws: Awaited<ReturnType<typeof getRecentLottoDraws>>,
  target: number
) {
  return draws
    .filter((draw) => draw.numbers.includes(target))
    .map((draw) => ({
      round: draw.round,
      drawDate: draw.drawDate,
      numbers: draw.numbers,
      bonus: draw.bonus,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { num } = await params;

  return {
    title: `숫자 ${num} 로또 통계 분석 | Lotto Insight`,
    description: `숫자 ${num}의 최근 출현 횟수, 출현 회차, 패턴 분석을 확인하세요.`,
  };
}

export default async function NumberDetailPage({ params }: Props) {
  const { num } = await params;
  const target = Number(num);

  if (!Number.isInteger(target) || target < 1 || target > 45) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-[#f1d17a]">잘못된 번호입니다.</h1>
          <p className="mt-4 text-white/60">1부터 45 사이 번호만 볼 수 있습니다.</p>
        </div>
      </main>
    );
  }

  const draws = await getRecentLottoDraws(50);
  const stats = buildLottoStats(draws);

  const hitCount = countNumberHits(draws, target);
  const hitRounds = getHitRounds(draws, target);
  const isRecentMissing = stats.recentMissingNumbers.includes(target);

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d17a]/70">
            Number Analysis
          </p>
          <h1 className="mt-3 flex items-center gap-4 text-3xl font-bold text-[#f1d17a]">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${getLottoBallColor(
                target
              )}`}
            >
              {target}
            </span>
            숫자 {target} 분석
          </h1>
          <p className="mt-4 text-sm text-white/60">
            최근 {draws.length}회 기준 출현 기록과 패턴을 확인할 수 있습니다.
          </p>
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
            <p className="text-sm text-white/50">최근 출현 횟수</p>
            <p className="mt-3 text-3xl font-bold text-[#f1d17a]">{hitCount}회</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
            <p className="text-sm text-white/50">최근 미출현 여부</p>
            <p className="mt-3 text-2xl font-bold text-[#f1d17a]">
              {isRecentMissing ? "미출현 번호" : "최근 출현 번호"}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
            <p className="text-sm text-white/50">최근 50회 기준 상태</p>
            <p className="mt-3 text-2xl font-bold text-[#f1d17a]">
              {hitCount >= 5 ? "강한 출현" : hitCount >= 3 ? "보통 출현" : "낮은 출현"}
            </p>
          </div>
        </div>

        <AdBanner height={160} />

        <div className="my-6 rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-bold text-[#f1d17a]">
            숫자 {target} 출현 회차
          </h2>

          {hitRounds.length === 0 ? (
            <p className="text-white/60">최근 회차에서 출현 기록이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {hitRounds.map((item) => (
                <div
                  key={item.round}
                  className="rounded-2xl border border-white/10 bg-[#0f1526] p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#f1d17a]">제 {item.round}회</p>
                      <p className="text-xs text-white/50">{item.drawDate}</p>
                    </div>

                    <a
                      href={`/lotto/${item.round}`}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                    >
                      회차 보기
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.numbers.map((num) => (
                      <div
                        key={num}
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                          num === target
                            ? "ring-2 ring-[#f1d17a] ring-offset-2 ring-offset-[#0f1526]"
                            : ""
                        } ${getLottoBallColor(num)}`}
                      >
                        {num}
                      </div>
                    ))}

                    <span className="mx-1 text-lg font-bold text-[#d4af37]">+</span>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${getLottoBallColor(
                        item.bonus
                      )}`}
                    >
                      {item.bonus}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <AdBanner height={140} />

        <div className="mt-6 rounded-3xl border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))] p-6 shadow-xl">
          <h2 className="mb-3 text-xl font-bold text-[#f1d17a]">
            숫자 {target} 기반 추천 조합
          </h2>
          <p className="mb-5 text-white/70">
            이 번호를 포함하는 프리미엄 추천 조합은 고급 분석 모드에서 확인할 수 있습니다.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="/pricing"
              className="rounded-xl bg-[#d4af37] px-5 py-3 font-bold text-[#11182b] hover:brightness-110"
            >
              프리미엄 보기
            </a>

            <a
              href="/"
              className="rounded-xl border border-white/10 bg-[#0f1526] px-5 py-3 font-semibold text-white/80 hover:bg-white/5"
            >
              홈으로 가기
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}