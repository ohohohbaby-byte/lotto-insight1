"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentFailClient() {
  const sp = useSearchParams();
  const code = sp.get("code");
  const message = sp.get("message");

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#131a2d] p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300/80">
          PAYMENT FAILED
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[#f1d17a]">등록 실패</h1>
        <p className="mt-4 text-white/70">
          {message ?? "결제수단 등록에 실패했습니다."}
        </p>
        {code && <p className="mt-2 text-xs text-white/40">code: {code}</p>}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="rounded-xl bg-[#d4af37] px-6 py-3 font-bold text-[#11182b]"
          >
            다시 시도
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/80"
          >
            메인
          </Link>
        </div>
      </div>
    </main>
  );
}
