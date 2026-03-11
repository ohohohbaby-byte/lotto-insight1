import { LottoDraw } from "@/types/lotto";

export type NumberFrequencyItem = {
  number: number;
  count: number;
};

export type LottoStats = {
  totalDraws: number;
  topFrequencies: NumberFrequencyItem[];
  recentMissingNumbers: number[];
  oddEven: {
    odd: number;
    even: number;
  };
  highLow: {
    high: number;
    low: number;
  };
};

function flattenNumbers(draws: LottoDraw[]): number[] {
  return draws.flatMap((draw) => draw.numbers);
}

export function getTopFrequencies(
  draws: LottoDraw[],
  topN = 10
): NumberFrequencyItem[] {
  const counts = new Map<number, number>();

  for (const num of flattenNumbers(draws)) {
    counts.set(num, (counts.get(num) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([number, count]) => ({ number, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.number - b.number;
    })
    .slice(0, topN);
}

export function getRecentMissingNumbers(draws: LottoDraw[]): number[] {
  const used = new Set(flattenNumbers(draws));
  const missing: number[] = [];

  for (let n = 1; n <= 45; n += 1) {
    if (!used.has(n)) {
      missing.push(n);
    }
  }

  return missing.slice(0, 6);
}

export function getOddEvenStats(draws: LottoDraw[]) {
  const allNumbers = flattenNumbers(draws);

  let odd = 0;
  let even = 0;

  for (const num of allNumbers) {
    if (num % 2 === 0) {
      even += 1;
    } else {
      odd += 1;
    }
  }

  return { odd, even };
}

export function getHighLowStats(draws: LottoDraw[]) {
  const allNumbers = flattenNumbers(draws);

  let low = 0;
  let high = 0;

  for (const num of allNumbers) {
    if (num >= 23) {
      high += 1;
    } else {
      low += 1;
    }
  }

  return { high, low };
}

export function buildLottoStats(draws: LottoDraw[]): LottoStats {
  return {
    totalDraws: draws.length,
    topFrequencies: getTopFrequencies(draws, 10),
    recentMissingNumbers: getRecentMissingNumbers(draws),
    oddEven: getOddEvenStats(draws),
    highLow: getHighLowStats(draws),
  };
}