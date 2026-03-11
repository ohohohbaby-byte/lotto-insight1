import { Suspense } from "react";
import PaymentFailClient from "./payment-fail-client";

export const dynamic = "force-dynamic";

function Fallback() {
  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#131a2d] p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">
          LOADING
        </p>
        <h1 className="mt-4 text-3xl font-bold text-[#f1d17a]">확인 중...</h1>
        <p className="mt-4 text-white/70">잠시만 기다려주세요.</p>
      </div>
    </main>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PaymentFailClient />
    </Suspense>
  );
}
