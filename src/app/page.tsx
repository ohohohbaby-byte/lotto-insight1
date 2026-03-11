import AdBanner from "@/components/AdBanner";
import type { Metadata } from "next";
import HomeDashboard from "@/components/HomeDashboard";
import { getRecentLottoDraws } from "@/lib/lottoApi";

export const metadata: Metadata = {
  title: "Lotto Insight | 로또 분석, 당첨번호 통계, AI 추천 조합",
  description:
    "로또 당첨번호 통계, 번호 출현 히트맵, 프리미엄 AI 추천 조합을 제공하는 데이터 기반 로또 분석 플랫폼.",
};

export default async function Home() {
  const initialDraws = await getRecentLottoDraws(50);

  return <HomeDashboard initialDraws={initialDraws} />;
}