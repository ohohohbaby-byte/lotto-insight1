"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

function parseNumberInput(input: string): number[] {
  return input
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v >= 1 && v <= 45);
}

function hasDuplicates(numbers: number[]): boolean {
  return new Set(numbers).size !== numbers.length;
}

function getSum(numbers: number[]): number {
  return numbers.reduce((acc, cur) => acc + cur, 0);
}

function getOddCount(numbers: number[]): number {
  return numbers.filter((n) => n % 2 !== 0).length;
}

function getHighCount(numbers: number[]): number {
  return numbers.filter((n) => n >= 23).length;
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

function isOddEvenBalanced(numbers: number[]): boolean {
  const oddCount = getOddCount(numbers);
  const evenCount = 6 - oddCount;

  return (
    (oddCount === 3 && evenCount === 3) ||
    (oddCount === 4 && evenCount === 2) ||
    (oddCount === 2 && evenCount === 4)
  );
}

function isHighLowBalanced(numbers: number[]): boolean {
  const highCount = getHighCount(numbers);
  const lowCount = 6 - highCount;

  return (
    (highCount === 3 && lowCount === 3) ||
    (highCount === 4 && lowCount === 2) ||
    (highCount === 2 && lowCount === 4)
  );
}

function generateLottoSetWithOptions(
  fixedNumbers: number[],
  excludedNumbers: number[],
  minSum: number,
  maxSum: number,
  requireOddEvenBalance: boolean,
  requireHighLowBalance: boolean,
  requireConsecutivePair: boolean
): number[] | null {
  const excludedSet = new Set(excludedNumbers);

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const result = new Set<number>();

    for (const num of fixedNumbers) {
      result.add(num);
    }

    while (result.size < 6) {
      const randomNumber = Math.floor(Math.random() * 45) + 1;
      if (excludedSet.has(randomNumber)) continue;
      result.add(randomNumber);
    }

    const finalSet = [...result].sort((a, b) => a - b);
    const sum = getSum(finalSet);

    if (sum < minSum || sum > maxSum) continue;
    if (requireOddEvenBalance && !isOddEvenBalanced(finalSet)) continue;
    if (requireHighLowBalance && !isHighLowBalanced(finalSet)) continue;
    if (requireConsecutivePair && !hasConsecutivePair(finalSet)) continue;

    return finalSet;
  }

  return null;
}

function generateMultipleSetsWithOptions(
  count: number,
  fixedNumbers: number[],
  excludedNumbers: number[],
  minSum: number,
  maxSum: number,
  requireOddEvenBalance: boolean,
  requireHighLowBalance: boolean,
  requireConsecutivePair: boolean
): number[][] {
  const results: number[][] = [];
  const seen = new Set<string>();

  let attempts = 0;
  while (results.length < count && attempts < 5000) {
    attempts += 1;

    const set = generateLottoSetWithOptions(
      fixedNumbers,
      excludedNumbers,
      minSum,
      maxSum,
      requireOddEvenBalance,
      requireHighLowBalance,
      requireConsecutivePair
    );

    if (!set) continue;

    const key = set.join("-");
    if (seen.has(key)) continue;

    seen.add(key);
    results.push(set);
  }

  return results;
}

export default function NumberGenerator() {
  const [generatedSets, setGeneratedSets] = useState<number[][]>([]);
  const [fixedInput, setFixedInput] = useState("");
  const [excludedInput, setExcludedInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [setCount, setSetCount] = useState("5");
  const [sumTarget, setSumTarget] = useState(125);
  const [oddEvenBalanced, setOddEvenBalanced] = useState(false);
  const [highLowBalanced, setHighLowBalanced] = useState(false);
  const [allowConsecutive, setAllowConsecutive] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const [isPremium, setIsPremium] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const initialGuide = useMemo(
    () => "무료 버전은 랜덤 조합 기반으로 추천됩니다.",
    []
  );

  const minSum = Math.max(21, sumTarget - 25);
  const maxSum = Math.min(255, sumTarget + 25);

  useEffect(() => {
    const loadPremiumStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsPremium(false);
          setAuthChecked(true);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", user.id)
          .single();

        if (error) {
          setIsPremium(false);
          setAuthChecked(true);
          return;
        }

        setIsPremium(!!data?.is_premium);
        setAuthChecked(true);
      } catch {
        setIsPremium(false);
        setAuthChecked(true);
      }
    };

    loadPremiumStatus();
  }, []);

  const handleGenerate = () => {
    const fixedNumbers = parseNumberInput(fixedInput);
    const excludedNumbers = parseNumberInput(excludedInput);

    if (hasDuplicates(fixedNumbers)) {
      setErrorMessage("고정수에 중복 번호가 있습니다.");
      setGeneratedSets([]);
      return;
    }

    if (hasDuplicates(excludedNumbers)) {
      setErrorMessage("제외수에 중복 번호가 있습니다.");
      setGeneratedSets([]);
      return;
    }

    if (fixedNumbers.length > 6) {
      setErrorMessage("고정수는 최대 6개까지 입력할 수 있습니다.");
      setGeneratedSets([]);
      return;
    }

    const overlap = fixedNumbers.some((num) => excludedNumbers.includes(num));
    if (overlap) {
      setErrorMessage("같은 번호를 고정수와 제외수에 동시에 넣을 수 없습니다.");
      setGeneratedSets([]);
      return;
    }

    if (excludedNumbers.length > 39) {
      setErrorMessage("제외수가 너무 많습니다. 최대 39개까지 입력 가능합니다.");
      setGeneratedSets([]);
      return;
    }

    const fixedSum = getSum(fixedNumbers);
    if (fixedNumbers.length === 6 && (fixedSum < minSum || fixedSum > maxSum)) {
      setErrorMessage("고정수 6개의 합계가 현재 범위를 벗어납니다.");
      setGeneratedSets([]);
      return;
    }

    if (oddEvenBalanced && fixedNumbers.length > 0) {
      const oddCount = getOddCount(fixedNumbers);
      const evenCount = fixedNumbers.length - oddCount;

      if (oddCount > 4 || evenCount > 4) {
        setErrorMessage("현재 고정수 조건으로는 홀짝 균형을 맞추기 어렵습니다.");
        setGeneratedSets([]);
        return;
      }
    }

    if (highLowBalanced && fixedNumbers.length > 0) {
      const highCount = getHighCount(fixedNumbers);
      const lowCount = fixedNumbers.length - highCount;

      if (highCount > 4 || lowCount > 4) {
        setErrorMessage("현재 고정수 조건으로는 고저 균형을 맞추기 어렵습니다.");
        setGeneratedSets([]);
        return;
      }
    }

    setCopiedIndex(null);
    setErrorMessage("");

    const count = Number(setCount);
    const newSets = generateMultipleSetsWithOptions(
      count,
      fixedNumbers,
      excludedNumbers,
      minSum,
      maxSum,
      oddEvenBalanced,
      highLowBalanced,
      allowConsecutive
    );

    if (newSets.length === 0) {
      setErrorMessage(
        "조건이 너무 까다로워 조합을 만들지 못했습니다. 조건을 조금 완화해보세요."
      );
      setGeneratedSets([]);
      return;
    }

    setGeneratedSets(newSets);
  };

  const handleCopy = async (set: number[], index: number) => {
    try {
      await navigator.clipboard.writeText(set.join(", "));
      setCopiedIndex(index);
      toast.success("번호가 복사되었습니다.");
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      setErrorMessage("복사에 실패했습니다. 다시 시도해주세요.");
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleSaveSet = async (set: number[], index: number) => {
    try {
      setSavingIndex(index);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("로그인 후 저장할 수 있습니다.");
        return;
      }

      const normalizedSet = [...set].sort((a, b) => a - b);

      const { data: existingRows, error: existingError } = await supabase
        .from("my_lotto")
        .select("id, numbers")
        .eq("user_id", user.id);

      if (existingError) {
        toast.error("저장된 조합 확인 중 오류가 발생했습니다.");
        return;
      }

      const alreadyExists =
        existingRows?.some((row) => {
          const savedNumbers = Array.isArray(row.numbers)
            ? [...row.numbers].sort((a, b) => a - b)
            : [];

          return JSON.stringify(savedNumbers) === JSON.stringify(normalizedSet);
        }) ?? false;

      if (alreadyExists) {
        toast("이미 MY 로또에 저장된 조합입니다.");
        return;
      }

      const { error: insertError } = await supabase.from("my_lotto").insert({
        user_id: user.id,
        numbers: normalizedSet,
      });

      if (insertError) {
        toast.error("MY 로또 저장에 실패했습니다.");
        return;
      }

      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <span>MY 로또에 저장되었습니다.</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = "/my-lotto";
              }}
              className="rounded-md border border-[#d4af37]/30 px-2 py-1 text-xs font-semibold text-[#f1d17a] hover:bg-[#d4af37]/10"
            >
              MY 로또로 이동
            </button>
          </div>
        ),
        {
          duration: 3500,
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setSavingIndex(null);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[#d4af37]">♪</span>
          <h2 className="text-xl font-bold text-[#f1d17a]">번호 시수 선별</h2>
        </div>

        <span className="rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold text-[#f1d17a]">
          FREE MODE
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-white/70">
            고정수 (쉼표로 구분)
          </label>
          <input
            value={fixedInput}
            onChange={(e) => setFixedInput(e.target.value)}
            placeholder="예: 7, 11"
            className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white outline-none placeholder:text-white/30"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">
            제외수 (쉼표로 구분)
          </label>
          <input
            value={excludedInput}
            onChange={(e) => setExcludedInput(e.target.value)}
            placeholder="예: 3, 9, 42"
            className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white outline-none placeholder:text-white/30"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-white/70">조합 수</label>
          <select
            value={setCount}
            onChange={(e) => setSetCount(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white/70 outline-none"
          >
            <option value="3">3세트</option>
            <option value="5">5세트</option>
            <option value="10">10세트</option>
          </select>
        </div>

        <div className="pt-2">
          <p className="mb-3 text-sm text-white/70">번호 합계 범위</p>
          <input
            type="range"
            min="70"
            max="180"
            value={sumTarget}
            onChange={(e) => setSumTarget(Number(e.target.value))}
            className="w-full accent-[#d4af37]"
          />
          <p className="mt-2 text-sm text-white/60">
            {minSum} ~ {maxSum}
          </p>
        </div>

        <div className="space-y-3 pt-2 text-sm text-white/80">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={oddEvenBalanced}
              onChange={(e) => setOddEvenBalanced(e.target.checked)}
              className="accent-[#d4af37]"
            />
            <span>홀짝 비율 균형</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={highLowBalanced}
              onChange={(e) => setHighLowBalanced(e.target.checked)}
              className="accent-[#d4af37]"
            />
            <span>고저 비율 균형</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allowConsecutive}
              onChange={(e) => setAllowConsecutive(e.target.checked)}
              className="accent-[#d4af37]"
            />
            <span>연속 번호 포함</span>
          </label>
        </div>

        <button
          onClick={handleGenerate}
          className="mt-4 w-full rounded-xl bg-[#d4af37] px-4 py-3 font-bold text-[#11182b] transition hover:brightness-110"
        >
          조합 생성
        </button>

        {errorMessage && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-[#0f1526] p-4">
          <p className="mb-3 text-sm text-white/60">{initialGuide}</p>

          {generatedSets.length === 0 ? (
            <p className="text-sm text-white/40">
              아직 생성된 조합이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {generatedSets.map((set, index) => {
                const oddCount = getOddCount(set);
                const evenCount = 6 - oddCount;
                const highCount = getHighCount(set);
                const lowCount = 6 - highCount;
                const consecutive = hasConsecutivePair(set) ? "있음" : "없음";

                return (
                  <div
                    key={`${set.join("-")}-${index}`}
                    className="rounded-xl border border-white/10 bg-[#131a2d] px-4 py-3"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#f1d17a]">
                          추천 조합 {index + 1}
                        </p>
                        <div className="mt-1 text-xs text-white/50">
                          <p>합계 {getSum(set)}</p>
                          <p>홀짝 {oddCount}:{evenCount}</p>
                          <p>고저 {highCount}:{lowCount}</p>
                          <p>연속 {consecutive}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(set, index)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                        >
                          {copiedIndex === index ? "복사됨" : "복사"}
                        </button>

                        <button
                          onClick={() => handleSaveSet(set, index)}
                          disabled={savingIndex === index}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingIndex === index ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {set.map((num) => {
                        const isFixed = parseNumberInput(fixedInput).includes(num);

                        return (
                          <div
                            key={num}
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
                              isFixed
                                ? "bg-green-400 text-[#11182b]"
                                : "bg-[#d4af37] text-[#11182b]"
                            }`}
                          >
                            {num}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))] p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-[#f1d17a]">
              PREMIUM 분석 모드
            </h3>
            <span className="rounded-full bg-[#d4af37] px-2 py-1 text-[10px] font-bold text-[#11182b]">
              {isPremium ? "PREMIUM" : "LOCK"}
            </span>
          </div>

          <p className="mb-3 text-sm text-white/70">
            프리미엄에서는 단순 랜덤이 아닌 데이터 기반 점수 분석으로 조합을 제공합니다.
          </p>

          <div className="space-y-2 text-xs text-white/70">
            <p>• 최근 미출현 점수 반영</p>
            <p>• 출현 빈도 기반 가중치 적용</p>
            <p>• 홀짝 / 고저 / 합계 균형 점수화</p>
            <p>• 번호대 분산 및 패턴 분석</p>
            <p>• 조합별 분석 점수 제공</p>
          </div>

          <button
            onClick={() => {
              if (!authChecked) return;

              if (!isPremium) {
                toast("프리미엄 회원 전용 기능입니다.");
                return;
              }

              toast.success("프리미엄 분석 모드로 이동합니다.");
            }}
            className="mt-4 w-full rounded-xl border border-[#d4af37]/30 bg-[#11182b] px-4 py-3 text-sm font-semibold text-[#f1d17a] hover:bg-[#0f1526]"
          >
            {isPremium ? "프리미엄 분석 시작" : "프리미엄 회원 전용"}
          </button>
        </div>
      </div>
    </div>
  );
}