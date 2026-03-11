"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PaymentRow = {
  id: string;
  order_id: string | null;
  provider: string | null;
  method: string | null;
  amount: number | null;
  status: string | null;
  payment_type: string | null;
  plan_code: string | null;
  approved_at: string | null;
  created_at: string | null;
};

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const loadPayments = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPayments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("payments")
        .select(
          "id, order_id, provider, method, amount, status, payment_type, plan_code, approved_at, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setPayments([]);
        setLoading(false);
        return;
      }

      setPayments((data as PaymentRow[]) ?? []);
    } catch (error) {
      console.error(error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f1d17a]/70">
            Payments
          </p>
          <h1 className="mt-4 text-3xl font-bold text-[#f1d17a]">
            결제내역
          </h1>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8">
            <p className="text-white/60">불러오는 중...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#131a2d] p-8">
            <p className="text-white/60">결제내역이 없습니다.</p>
            <Link
              href="/premium"
              className="mt-6 inline-block rounded-xl bg-[#d4af37] px-6 py-3 font-bold text-[#11182b] hover:brightness-110"
            >
              프리미엄 가입하러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-3xl border border-white/10 bg-[#131a2d] p-6 shadow-xl"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-[#0f1526] p-4">
                    <p className="text-sm text-white/50">결제 금액</p>
                    <p className="mt-2 text-xl font-bold text-[#f1d17a]">
                      {payment.amount?.toLocaleString("ko-KR") ?? 0}원
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#0f1526] p-4">
                    <p className="text-sm text-white/50">상태</p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {payment.status ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#0f1526] p-4">
                    <p className="text-sm text-white/50">결제 방식</p>
                    <p className="mt-2 text-lg font-bold text-white">
                      {payment.method ?? payment.provider ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#0f1526] p-4 text-sm text-white/70">
                  <p>주문번호: {payment.order_id ?? "-"}</p>
                  <p className="mt-2">결제유형: {payment.payment_type ?? "-"}</p>
                  <p className="mt-2">플랜: {payment.plan_code ?? "-"}</p>
                  <p className="mt-2">
                    승인일:
                    {" "}
                    {payment.approved_at
                      ? new Date(payment.approved_at).toLocaleString("ko-KR")
                      : "-"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}