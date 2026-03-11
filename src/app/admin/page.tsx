"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { LottoDraw } from "@/types/lotto";
import {
  deleteAdminDraw,
  getAdminDraws,
  saveAdminDraw,
} from "@/lib/clientLottoStorage";
import { getLottoBallColor } from "@/lib/lottoColor";

function parseNumbers(input: string): number[] {
  return input
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v >= 1 && v <= 45);
}

function hasDuplicates(numbers: number[]): boolean {
  return new Set(numbers).size !== numbers.length;
}

function isValidDraw(draw: LottoDraw): boolean {
  if (!Number.isInteger(draw.round) || draw.round < 1) return false;
  if (!draw.drawDate) return false;
  if (!Array.isArray(draw.numbers) || draw.numbers.length !== 6) return false;
  if (hasDuplicates(draw.numbers)) return false;

  if (draw.numbers.some((n) => !Number.isInteger(n) || n < 1 || n > 45)) {
    return false;
  }

  if (!Number.isInteger(draw.bonus) || draw.bonus < 1 || draw.bonus > 45) {
    return false;
  }

  if (draw.numbers.includes(draw.bonus)) return false;

  return true;
}

function parseDrawText(text: string): LottoDraw | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const dateMatch = trimmed.match(/\d{4}-\d{2}-\d{2}/);
  const roundMatch = trimmed.match(/\b\d{3,5}\b/);

  if (!dateMatch || !roundMatch) {
    return null;
  }

  const drawDate = dateMatch[0];
  const round = Number(roundMatch[0]);

  const numberMatches = trimmed.match(/\b\d+\b/g);
  if (!numberMatches) {
    return null;
  }

  const allNumbers = numberMatches.map(Number);
  const drawDateParts = drawDate.split("-").map(Number);

  const withoutDateParts = allNumbers.filter(
    (num) => !drawDateParts.includes(num) || num > 45
  );

  const withoutRound = withoutDateParts.filter((num) => num !== round);
  const lottoNums = withoutRound.filter((num) => num >= 1 && num <= 45);

  if (lottoNums.length < 7) {
    return null;
  }

  const numbers = lottoNums.slice(0, 6).sort((a, b) => a - b);
  const bonus = lottoNums[6];

  const draw: LottoDraw = {
    round,
    drawDate,
    numbers,
    bonus,
  };

  return isValidDraw(draw) ? draw : null;
}

type AdminProfile = {
  role: string | null;
};

type PremiumRequestRow = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  request_message: string | null;
  created_at: string;
  profiles: {
    name: string | null;
    nickname: string | null;
  } | null;
};

function getRequestStatusLabel(status: PremiumRequestRow["status"]) {
  if (status === "pending") return "대기 중";
  if (status === "approved") return "승인 완료";
  if (status === "rejected") return "반려";
  return status;
}

function getRequestStatusColor(status: PremiumRequestRow["status"]) {
  if (status === "pending") return "bg-yellow-400/15 text-yellow-300";
  if (status === "approved") return "bg-green-400/15 text-green-300";
  if (status === "rejected") return "bg-red-400/15 text-red-300";
  return "bg-white/10 text-white/70";
}

export default function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [round, setRound] = useState("");
  const [drawDate, setDrawDate] = useState("");
  const [numbersInput, setNumbersInput] = useState("");
  const [bonusInput, setBonusInput] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [message, setMessage] = useState("");
  const [savedDraws, setSavedDraws] = useState<LottoDraw[]>([]);
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequestRow[]>(
    []
  );
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshDraws = () => {
    setSavedDraws(getAdminDraws());
  };

  const refreshPremiumRequests = async () => {
  const { data, error } = await supabase
    .from("premium_requests")
    .select("id, user_id, status, request_message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setPremiumRequests([]);
    return;
  }

  const requests = (data ?? []) as Array<{
    id: string;
    user_id: string;
    status: "pending" | "approved" | "rejected";
    request_message: string | null;
    created_at: string;
  }>;

  if (requests.length === 0) {
    setPremiumRequests([]);
    return;
  }

  const userIds = [...new Set(requests.map((item) => item.user_id))];

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, name, nickname")
    .in("id", userIds);

  if (profilesError) {
    console.error(profilesError);
    setPremiumRequests(
      requests.map((request) => ({
        ...request,
        profiles: null,
      }))
    );
    return;
  }

  const profileMap = new Map(
    (profilesData ?? []).map((profile) => [profile.id, profile])
  );

  const merged = requests.map((request) => ({
    ...request,
    profiles: profileMap.get(request.user_id)
      ? {
          name: profileMap.get(request.user_id)?.name ?? null,
          nickname: profileMap.get(request.user_id)?.nickname ?? null,
        }
      : null,
  }));

  setPremiumRequests(merged as PremiumRequestRow[]);
};

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoggedIn(false);
          setIsAdmin(false);
          setCheckingAuth(false);
          return;
        }

        setIsLoggedIn(true);

        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          setIsAdmin(false);
          setCheckingAuth(false);
          return;
        }

        const profile = data as AdminProfile;
        setIsAdmin(profile.role === "admin");
      } catch {
        setIsLoggedIn(false);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminAuth();
    refreshDraws();
    refreshPremiumRequests();
  }, []);

  const handleSave = () => {
    const parsedRound = Number(round);
    const parsedNumbers = parseNumbers(numbersInput);
    const parsedBonus = Number(bonusInput);

    if (!Number.isInteger(parsedRound) || parsedRound < 1) {
      setMessage("회차 번호를 올바르게 입력해주세요.");
      return;
    }

    if (!drawDate) {
      setMessage("추첨일을 입력해주세요.");
      return;
    }

    if (parsedNumbers.length !== 6) {
      setMessage("메인 번호는 쉼표로 구분된 6개여야 합니다.");
      return;
    }

    if (hasDuplicates(parsedNumbers)) {
      setMessage("메인 번호에 중복이 있습니다.");
      return;
    }

    if (!Number.isInteger(parsedBonus) || parsedBonus < 1 || parsedBonus > 45) {
      setMessage("보너스 번호를 올바르게 입력해주세요.");
      return;
    }

    if (parsedNumbers.includes(parsedBonus)) {
      setMessage("보너스 번호는 메인 번호와 겹칠 수 없습니다.");
      return;
    }

    const draw: LottoDraw = {
      round: parsedRound,
      drawDate,
      numbers: [...parsedNumbers].sort((a, b) => a - b),
      bonus: parsedBonus,
    };

    saveAdminDraw(draw);
    refreshDraws();

    setMessage(`제 ${parsedRound}회 데이터가 저장되었습니다.`);
    setRound("");
    setDrawDate("");
    setNumbersInput("");
    setBonusInput("");
  };

  const handleParseAndSave = () => {
    const parsed = parseDrawText(bulkText);

    if (!parsed) {
      setMessage("붙여넣기 텍스트를 파싱하지 못했습니다. 형식을 다시 확인해주세요.");
      return;
    }

    saveAdminDraw(parsed);
    refreshDraws();

    setRound(String(parsed.round));
    setDrawDate(parsed.drawDate);
    setNumbersInput(parsed.numbers.join(", "));
    setBonusInput(String(parsed.bonus));
    setBulkText("");
    setMessage(`텍스트 파싱 성공: 제 ${parsed.round}회 데이터가 저장되었습니다.`);
  };

  const handleDelete = (round: number) => {
    deleteAdminDraw(round);
    refreshDraws();
    setMessage(`제 ${round}회 데이터를 삭제했습니다.`);
  };

  const handleExport = () => {
    try {
      const data = getAdminDraws();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "lotto-admin-draws.json";
      a.click();

      URL.revokeObjectURL(url);
      setMessage("관리자 데이터를 JSON으로 다운로드했습니다.");
    } catch {
      setMessage("JSON 다운로드에 실패했습니다.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as LottoDraw[];

      if (!Array.isArray(parsed)) {
        setMessage("올바른 JSON 배열 형식이 아닙니다.");
        return;
      }

      const validDraws = parsed.filter(isValidDraw);

      if (validDraws.length === 0) {
        setMessage("가져올 수 있는 유효한 회차 데이터가 없습니다.");
        return;
      }

      for (const draw of validDraws) {
        saveAdminDraw({
          ...draw,
          numbers: [...draw.numbers].sort((a, b) => a - b),
        });
      }

      refreshDraws();
      setMessage(`${validDraws.length}개의 회차 데이터를 복원했습니다.`);
    } catch {
      setMessage("JSON 불러오기에 실패했습니다.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleApprovePremium = async (request: PremiumRequestRow) => {
    try {
      setProcessingRequestId(request.id);

      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ is_premium: true })
        .eq("id", request.user_id);

      if (updateProfileError) {
        toast.error("프리미엄 활성화에 실패했습니다.");
        return;
      }

      const { error: updateRequestError } = await supabase
        .from("premium_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (updateRequestError) {
        toast.error("신청 상태 업데이트에 실패했습니다.");
        return;
      }

      toast.success("프리미엄 신청을 승인했습니다.");
      await refreshPremiumRequests();
    } catch (error) {
      console.error(error);
      toast.error("승인 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectPremium = async (request: PremiumRequestRow) => {
    try {
      setProcessingRequestId(request.id);

      const { error } = await supabase
        .from("premium_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      if (error) {
        toast.error("신청 반려 처리에 실패했습니다.");
        return;
      }

      toast.success("프리미엄 신청을 반려했습니다.");
      await refreshPremiumRequests();
    } catch (error) {
      console.error(error);
      toast.error("반려 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessingRequestId(null);
    }
  };

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8 text-center shadow-xl">
            <p className="text-white/60">관리자 권한 확인 중입니다.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8 text-center shadow-xl">
            <h1 className="text-2xl font-bold text-[#f1d17a]">관리자 페이지</h1>
            <p className="mt-4 text-white/70">로그인 후 접근할 수 있습니다.</p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-xl bg-[#d4af37] px-6 py-3 font-bold text-[#11182b] hover:brightness-110"
            >
              로그인하러 가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-red-400/20 bg-[#131a2d] p-8 text-center shadow-xl">
            <h1 className="text-2xl font-bold text-[#f1d17a]">접근 권한 없음</h1>
            <p className="mt-4 text-white/70">
              이 페이지는 관리자만 접근할 수 있습니다.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/80 hover:bg-white/10"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f1d17a]/70">
            Admin
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#f1d17a]">
            회차 데이터 관리
          </h1>
          <p className="mt-3 text-sm text-white/60">
            최신 회차를 직접 추가하고, 관리자 데이터를 백업/복원할 수 있습니다.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-[#d4af37]/20 bg-[linear-gradient(135deg,rgba(212,175,55,0.12),rgba(255,255,255,0.02))] p-6 shadow-xl">
          <h2 className="text-lg font-bold text-[#f1d17a]">프리미엄 운영 연결됨</h2>
          <p className="mt-3 text-sm text-white/70">
            이 관리자 페이지에서 프리미엄 신청 요청을 확인하고 승인/반려할 수 있습니다.
            기존 회차 관리 기능도 그대로 유지됩니다.
          </p>
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
          <h2 className="mb-5 text-lg font-bold text-[#f1d17a]">
            프리미엄 신청 요청 관리
          </h2>

          {premiumRequests.length === 0 ? (
            <div className="rounded-2xl bg-[#0f1526] p-6 text-white/50">
              아직 접수된 프리미엄 신청이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {premiumRequests.map((request) => {
                const displayName =
  request.profiles?.nickname || request.profiles?.name || request.user_id;

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-white/10 bg-[#0f1526] p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-[#f1d17a]">
                          {displayName}
                        </p>
                        <p className="mt-1 text-xs text-white/50">
                          신청일{" "}
                          {new Date(request.created_at).toLocaleString("ko-KR")}
                        </p>

                        <div className="mt-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getRequestStatusColor(
                              request.status
                            )}`}
                          >
                            {getRequestStatusLabel(request.status)}
                          </span>
                        </div>

                        {request.request_message && (
                          <p className="mt-3 text-sm text-white/70">
                            요청 메시지: {request.request_message}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprovePremium(request)}
                          disabled={
                            processingRequestId === request.id ||
                            request.status === "approved"
                          }
                          className="rounded-lg bg-[#d4af37] px-4 py-2 text-sm font-bold text-[#11182b] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          승인
                        </button>

                        <button
                          onClick={() => handleRejectPremium(request)}
                          disabled={
                            processingRequestId === request.id ||
                            request.status === "rejected"
                          }
                          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          반려
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-6 rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-bold text-[#f1d17a]">
            관리자 데이터 도구
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleExport}
              className="rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 font-semibold text-white/80 hover:bg-white/5"
            >
              JSON 다운로드
            </button>

            <button
              onClick={handleImportClick}
              className="rounded-xl bg-[#d4af37] px-4 py-3 font-bold text-[#11182b] hover:brightness-110"
            >
              JSON 불러오기
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
              <h2 className="mb-5 text-lg font-bold text-[#f1d17a]">
                텍스트 붙여넣기 자동 파싱
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    회차 텍스트
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={`예시 1: 1127 / 2024-07-06 / 3, 11, 24, 28, 35, 42 / bonus 9\n예시 2: 1127 2024-07-06 3 11 24 28 35 42 9`}
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <button
                  onClick={handleParseAndSave}
                  className="w-full rounded-xl bg-[#d4af37] px-4 py-3 font-bold text-[#11182b] hover:brightness-110"
                >
                  텍스트 파싱 후 저장
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
              <h2 className="mb-5 text-lg font-bold text-[#f1d17a]">
                수동 회차 추가
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/70">회차</label>
                  <input
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    placeholder="예: 1127"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    추첨일
                  </label>
                  <input
                    type="date"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    메인 번호 6개
                  </label>
                  <input
                    value={numbersInput}
                    onChange={(e) => setNumbersInput(e.target.value)}
                    placeholder="예: 3, 11, 24, 28, 35, 42"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">
                    보너스 번호
                  </label>
                  <input
                    value={bonusInput}
                    onChange={(e) => setBonusInput(e.target.value)}
                    placeholder="예: 9"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <button
                  onClick={handleSave}
                  className="w-full rounded-xl bg-[#d4af37] px-4 py-3 font-bold text-[#11182b] hover:brightness-110"
                >
                  회차 저장
                </button>

                {message && (
                  <div className="rounded-xl border border-white/10 bg-[#0f1526] px-4 py-3 text-sm text-white/80">
                    {message}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-[#f1d17a]">
              관리자 저장 회차
            </h2>

            {savedDraws.length === 0 ? (
              <div className="rounded-2xl bg-[#0f1526] p-6 text-white/50">
                아직 추가된 관리자 회차가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {savedDraws.map((draw) => (
                  <div
                    key={draw.round}
                    className="rounded-2xl border border-white/10 bg-[#0f1526] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#f1d17a]">
                          제 {draw.round}회
                        </p>
                        <p className="text-xs text-white/50">{draw.drawDate}</p>
                      </div>

                      <button
                        onClick={() => handleDelete(draw.round)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10"
                      >
                        삭제
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {draw.numbers.map((num) => (
                        <div
                          key={num}
                          className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${getLottoBallColor(
                            num
                          )}`}
                        >
                          {num}
                        </div>
                      ))}

                      <span className="mx-1 text-lg font-bold text-[#d4af37]">
                        +
                      </span>

                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${getLottoBallColor(
                          draw.bonus
                        )}`}
                      >
                        {draw.bonus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}