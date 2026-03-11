import { LottoDraw } from "@/types/lotto";
import { buildLottoStats } from "@/lib/lottoStats";

export type PremiumAnalysisResult = {
  totalScore: number;
  frequencyScore: number;
  recentMissScore: number;
  oddEvenScore: number;
  highLowScore: number;
  sumScore: number;
  consecutiveScore: number;
  spreadScore: number;
  endDigitScore: number;
  crowdPenaltyScore: number;
};

export type PremiumRankedSet = {
  numbers: number[];
  analysis: PremiumAnalysisResult;
};

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((acc, cur) => acc + cur, 0) / values.length);
}

function getOddCount(numbers: number[]): number {
  return numbers.filter((n) => n % 2 !== 0).length;
}

function getHighCount(numbers: number[]): number {
  return numbers.filter((n) => n >= 23).length;
}

function getSum(numbers: number[]): number {
  return numbers.reduce((acc, cur) => acc + cur, 0);
}

function hasConsecutivePair(numbers: number[]): boolean {
  const sorted = [...numbers].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (sorted[i + 1] - sorted[i] === 1) {
      return true;
    }
  }
  return false;
}

function calculateOddEvenScore(numbers: number[]): number {
  const oddCount = getOddCount(numbers);
  if (oddCount === 3) return 95;
  if (oddCount === 2 || oddCount === 4) return 85;
  if (oddCount === 1 || oddCount === 5) return 60;
  return 35;
}

function calculateHighLowScore(numbers: number[]): number {
  const highCount = getHighCount(numbers);
  if (highCount === 3) return 95;
  if (highCount === 2 || highCount === 4) return 85;
  if (highCount === 1 || highCount === 5) return 60;
  return 35;
}

function calculateSumScore(numbers: number[]): number {
  const sum = getSum(numbers);
  if (sum >= 100 && sum <= 160) return 95;
  if (sum >= 90 && sum <= 170) return 80;
  if (sum >= 80 && sum <= 180) return 65;
  return 40;
}

function calculateConsecutiveScore(numbers: number[]): number {
  return hasConsecutivePair(numbers) ? 80 : 65;
}

function calculateFrequencyScore(numbers: number[], draws: LottoDraw[]): number {
  const stats = buildLottoStats(draws);
  const freqMap = new Map<number, number>();

  for (const item of stats.topFrequencies) {
    freqMap.set(item.number, item.count);
  }

  const maxCount = stats.topFrequencies[0]?.count ?? 1;

  const values = numbers.map((n) => {
    const count = freqMap.get(n) ?? 0;
    return Math.round((count / maxCount) * 100);
  });

  return average(values);
}

function calculateRecentMissScore(numbers: number[], draws: LottoDraw[]): number {
  const stats = buildLottoStats(draws);
  const missingSet = new Set(stats.recentMissingNumbers);
  const values = numbers.map((n) => (missingSet.has(n) ? 95 : 55));
  return average(values);
}

function calculateSpreadScore(numbers: number[]): number {
  const sections = [0, 0, 0, 0, 0]; // 1-9, 10-19, 20-29, 30-39, 40-45

  for (const num of numbers) {
    if (num <= 9) sections[0] += 1;
    else if (num <= 19) sections[1] += 1;
    else if (num <= 29) sections[2] += 1;
    else if (num <= 39) sections[3] += 1;
    else sections[4] += 1;
  }

  const usedSections = sections.filter((v) => v > 0).length;
  const maxInSection = Math.max(...sections);

  if (usedSections >= 4 && maxInSection <= 2) return 95;
  if (usedSections >= 3 && maxInSection <= 3) return 80;
  if (usedSections >= 2) return 65;
  return 40;
}

function calculateEndDigitScore(numbers: number[]): number {
  const counts = new Map<number, number>();

  for (const num of numbers) {
    const endDigit = num % 10;
    counts.set(endDigit, (counts.get(endDigit) ?? 0) + 1);
  }

  const maxRepeat = Math.max(...Array.from(counts.values()));

  if (maxRepeat === 1) return 95;
  if (maxRepeat === 2) return 80;
  if (maxRepeat === 3) return 55;
  return 35;
}

function calculateCrowdPenaltyScore(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  let closePairs = 0;

  for (let i = 0; i < sorted.length - 1; i += 1) {
    if (sorted[i + 1] - sorted[i] <= 2) {
      closePairs += 1;
    }
  }

  if (closePairs <= 1) return 95;
  if (closePairs === 2) return 75;
  if (closePairs === 3) return 55;
  return 35;
}

export function analyzePremiumCombination(
  numbers: number[],
  draws: LottoDraw[]
): PremiumAnalysisResult {
  const frequencyScore = calculateFrequencyScore(numbers, draws);
  const recentMissScore = calculateRecentMissScore(numbers, draws);
  const oddEvenScore = calculateOddEvenScore(numbers);
  const highLowScore = calculateHighLowScore(numbers);
  const sumScore = calculateSumScore(numbers);
  const consecutiveScore = calculateConsecutiveScore(numbers);
  const spreadScore = calculateSpreadScore(numbers);
  const endDigitScore = calculateEndDigitScore(numbers);
  const crowdPenaltyScore = calculateCrowdPenaltyScore(numbers);

  const totalScore = Math.round(
    frequencyScore * 0.16 +
      recentMissScore * 0.16 +
      oddEvenScore * 0.12 +
      highLowScore * 0.12 +
      sumScore * 0.12 +
      consecutiveScore * 0.08 +
      spreadScore * 0.10 +
      endDigitScore * 0.07 +
      crowdPenaltyScore * 0.07
  );

  return {
    totalScore,
    frequencyScore,
    recentMissScore,
    oddEvenScore,
    highLowScore,
    sumScore,
    consecutiveScore,
    spreadScore,
    endDigitScore,
    crowdPenaltyScore,
  };
}

function generateRandomSet(): number[] {
  const numbers = new Set<number>();

  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }

  return [...numbers].sort((a, b) => a - b);
}

export function generatePremiumTopSets(
  draws: LottoDraw[],
  candidateCount = 400,
  topN = 10
): PremiumRankedSet[] {
  const ranked: PremiumRankedSet[] = [];
  const seen = new Set<string>();

  let attempts = 0;

  while (ranked.length < candidateCount && attempts < candidateCount * 6) {
    attempts += 1;

    const numbers = generateRandomSet();
    const key = numbers.join("-");

    if (seen.has(key)) continue;
    seen.add(key);

    const analysis = analyzePremiumCombination(numbers, draws);
    ranked.push({ numbers, analysis });
  }

  return ranked
    .sort((a, b) => {
      if (b.analysis.totalScore !== a.analysis.totalScore) {
        return b.analysis.totalScore - a.analysis.totalScore;
      }
      return b.analysis.spreadScore - a.analysis.spreadScore;
    })
    .slice(0, topN);
}