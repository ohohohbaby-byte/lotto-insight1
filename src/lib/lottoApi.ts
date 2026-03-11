import { LottoDraw } from "@/types/lotto";
import { lottoDraws } from "@/data/lottoDraws";

export async function fetchLottoRound(
  round: number
): Promise<LottoDraw | null> {
  const draw = lottoDraws.find((item) => item.round === round);
  return draw ?? null;
}

export async function getLottoByRound(
  round: number
): Promise<LottoDraw | null> {
  return fetchLottoRound(round);
}

export async function getLatestLottoDraw(): Promise<LottoDraw | null> {
  if (lottoDraws.length === 0) {
    return null;
  }

  return lottoDraws[0];
}

export async function getRecentLottoDraws(count: number): Promise<LottoDraw[]> {
  return lottoDraws.slice(0, count);
}