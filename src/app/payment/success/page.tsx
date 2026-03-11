"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "error";

export default function PaymentSuccessPage() {
  const sp = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("결제수단 등록 처리 중입니다...");
  const [detail, setDetail] = useState<string | null>(null);

  const params = useMemo(() => {
    return {
      authKey: sp.get("authKey"),
      customerKey: sp.get("customerKey"),
    };
  }, [sp]);

  useEffect(() => {
    const run = async () => {
      if (!params.authKey || !params.customerKey) {
        setStatus("error");
        setMessage("authKey/customerKey가 없습니다. 토스 successUrl이 맞는지 확인해주세요.");
        setDetail(`authKey=${params.authKey ?? "없음"} | customerKey=${params.customerKey ?? "없음"}`);
        return;
      }

      try {
        setStatus("loading");
        setMessage("빌링키 발급(구독 등록) 중입니다...");

        const res = await fetch("/api/billing/toss/issue-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authKey: params.authKey,
            customerKey: params.customerKey,
          }),
        });

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          setStatus("error");
          setMessage(`서버가 JSON이 아닌 응답을 반환했습니다. (HTTP ${res.status})`);
          setDetail(text.slice(0, 400));
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data?.message || `빌링키 발급 실패 (HTTP ${res.status})`);
          setDetail(JSON.stringify(data, null, 2));
          return;
        }

        setStatus("success");
        setMessage("월구독 결제수단 등록 완료! (첫달 무료 적용)");
        if (data?.trialEnd) {
          setDetail(`첫 결제 예정일(무료 종료): ${new Date(data.trialEnd).toLocaleString("ko-KR")}`);
        } else {
          setDetail(null);
        }
      } catch (e) {
        setStatus("error");
        setMessage("처리 중 오류가 발생했습니다.");
        setDetail(String(e));
      }
    };

    run();
  }, [params]);

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#131a2d] p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f1d17a]/70">
          PAYMENT SUCCESS
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[#f1d17a]">월구독 등록 완료</h1>
        <p className="mt-4 text-white/70">{message}</p>

        {detail && (
          <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-xs text-white/80">
{detail}
          </pre>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/premium"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/80 hover:bg-white/10"
          >
            프리미엄 페이지로 이동
          </Link>

          {status === "success" && (
            <Link
              href="/"
              className="rounded-xl bg-[#d4af37] px-6 py-3 font-bold text-[#11182b] hover:brightness-110"
            >
              메인으로 이동
            </Link>
          )}
        </div>

        <p className="mt-6 text-xs text-white/40">
          * 첫달 무료: 결제수단 등록 후 다음 결제일에 자동 청구됩니다.
        </p>
      </div>
    </main>
  );
}
