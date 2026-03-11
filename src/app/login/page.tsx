"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const validateForm = () => {
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!password.trim()) return "비밀번호를 입력해주세요.";
    return null;
  };

  const handleLogin = async () => {
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      setMessage("로그인 성공! 메인 페이지로 이동합니다.");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (err) {
      console.error(err);
      setMessage("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#07111f] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#d4af37]/20 bg-[#0f1b31] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">로그인</h1>
          <p className="mt-2 text-sm text-slate-400">
            LOTTO INSIGHT 계정으로 로그인해주세요.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60"
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-[#d4af37] py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "로그인 처리 중..." : "로그인"}
          </button>

          {message && (
            <p className="text-center text-sm text-[#f0c85a]">{message}</p>
          )}

          <div className="pt-2 text-center text-sm text-slate-400">
            아직 회원이 아니신가요?{" "}
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="font-semibold text-[#d4af37] hover:underline"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}