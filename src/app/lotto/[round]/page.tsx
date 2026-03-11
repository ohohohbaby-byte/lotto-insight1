import type { Metadata } from "next";
import AdBanner from "@/components/AdBanner";
import { getRecentLottoDraws } from "@/lib/lottoApi";
import { getLottoBallColor } from "@/lib/lottoColor";
import { buildLottoStats } from "@/lib/lottoStats";

type Props = {
  params: Promise<{
    round: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { round } = await params;

  return {
    title: `제${round}회 로또 당첨번호 분석 | Lotto Insight`,
    description: `제${round}회 로또 당첨번호, 추첨일, 번호 패턴 분석과 추천 조합 정보를 확인하세요.`,
  };
}

export default async function LottoRoundPage({ params }: Props) {
  const { round } = await params;
  const roundNumber = Number(round);

  const draws = await getRecentLottoDraws(100);
  const draw = draws.find((d) => d.round === roundNumber);

  if (!draw) {
    return (
      <main className="min-h-screen bg-[#0b1020] p-10 text-white">
        <h1 className="text-3xl font-bold">해당 회차 데이터를 찾을 수 없습니다</h1>
      </main>
    );
  }

  const stats = buildLottoStats(draws.slice(0, 20));

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-3xl font-bold text-[#f1d17a]">
          제 {draw.round}회 로또 당첨번호
        </h1>

        <p className="mb-8 text-white/60">추첨일 {draw.drawDate}</p>

        <div className="mb-10 flex flex-wrap gap-3">
          {draw.numbers.map((num) => (
            <div
              key={num}
              className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${getLottoBallColor(
                num
              )}`}
            >
              {num}
            </div>
          ))}

          <span className="text-2xl font-bold text-[#d4af37]">+</span>

          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ${getLottoBallColor(
              draw.bonus
            )}`}
          >
            {draw.bonus}
          </div>
        </div>

        <AdBanner height={160} />

        <div className="my-10 rounded-3xl border border-white/10 bg-[#131a2d] p-6">
          <h2 className="mb-4 text-xl font-bold text-[#f1d17a]">로또 패턴 분석</h2>

          <p className="mb-3 text-white/70">
            최근 {stats.totalDraws}회 데이터를 기반으로 분석한 결과입니다.
          </p>

          <ul className="space-y-2 text-white/80">
            <li>홀수 {stats.oddEven.odd} / 짝수 {stats.oddEven.even}</li>
            <li>고번호 {stats.highLow.high} / 저번호 {stats.highLow.low}</li>
            <li>최근 미출현 번호 {stats.recentMissingNumbers.join(", ")}</li>
          </ul>
        </div>

        <AdBanner height={140} />

        <div className="mt-10 rounded-3xl border border-[#d4af37]/20 bg-[#0f1526] p-8">
          <h2 className="mb-4 text-2xl font-bold text-[#f1d17a]">
            다음 회차 추천 조합
          </h2>

          <p className="mb-6 text-white/70">
            AI 분석 기반 추천 조합은 프리미엄 회원에게 제공됩니다.
          </p>

          <a
            href="/pricing"
            className="inline-block rounded-xl bg-[#d4af37] px-6 py-4 font-bold text-[#11182b] hover:brightness-110"
          >
            프리미엄 분석 보기
          </a>
        </div>
      </div>
    </main>
  );
}