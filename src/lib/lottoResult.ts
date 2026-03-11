import { LottoDraw } from "@/types/lotto";

export type LottoCheckResult = {
  matchedNumbers: number[];
  matchCount: number;
  bonusMatched: boolean;
  rankLabel: string;
};

export function checkLottoResult(
  userNumbers: number[],
  draw: LottoDraw
): LottoCheckResult {
  const mainNumbers = new Set(draw.numbers);
  const matchedNumbers = userNumbers
    .filter((num) => mainNumbers.has(num))
    .sort((a, b) => a - b);

  const matchCount = matchedNumbers.length;
  const bonusMatched =
    userNumbers.includes(draw.bonus) && !mainNumbers.has(draw.bonus);

  let rankLabel = "미당첨";

  if (matchCount === 6) {
    rankLabel = "1등";
  } else if (matchCount === 5 && bonusMatched) {
    rankLabel = "2등";
  } else if (matchCount === 5) {
    rankLabel = "3등";
  } else if (matchCount === 4) {
    rankLabel = "4등";
  } else if (matchCount === 3) {
    rankLabel = "5등";
  }

  return {
    matchedNumbers,
    matchCount,
    bonusMatched,
    rankLabel,
  };
}