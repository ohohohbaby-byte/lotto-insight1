import { NextResponse } from "next/server";
import { getRecentLottoDraws } from "@/lib/lottoApi";
import { buildLottoStats } from "@/lib/lottoStats";

export async function GET() {
  try {
    const draws = await getRecentLottoDraws(10);
    const stats = buildLottoStats(draws);

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { message: "통계 데이터를 가져오지 못했습니다." },
      { status: 500 }
    );
  }
}