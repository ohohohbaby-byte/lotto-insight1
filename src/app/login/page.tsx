"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const validateForm = () => {
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!password.trim()) return "비밀번호를 입력해주세요.";
    return null;
  };

  const handleLogin = async () => {
    setMessage("");
    const validationError = validateForm();
    if (validationError) { setMessage(validationError); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setMessage("이메일 또는 비밀번호가 올바르지 않습니다."); return; }
      setMessage("로그인 성공! 메인 페이지로 이동합니다.");
      setTimeout(() => { router.push("/"); router.refresh(); }, 700);
    } catch (err) {
      console.error(err);
      setMessage("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "kakao") => {
    try {
      setSocialLoading(provider);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) { setMessage("소셜 로그인 중 오류가 발생했습니다."); }
    } catch (err) {
      console.error(err);
      setMessage("소셜 로그인 중 오류가 발생했습니다.");
    } finally {
      setSocialLoading(null);
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

        {/* 소셜 로그인 버튼 */}
        <div className="space-y-3 mb-6">

          {/* 구글 */}
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={!!socialLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {socialLoading === "google" ? "처리 중..." : "Google로 로그인"}
          </button>

          {/* 카카오 */}
          <button
            onClick={() => handleSocialLogin("kakao")}
            disabled={!!socialLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#FEE500] py-3 font-semibold text-[#191919] hover:brightness-95 disabled:opacity-50 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
              <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.667 1.69 5.01 4.267 6.395L5.2 20.1a.5.5 0 0 0 .725.535L10.35 18.1A11.6 11.6 0 0 0 12 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"/>
            </svg>
            {socialLoading === "kakao" ? "처리 중..." : "카카오로 로그인"}
          </button>

          {/* 네이버 */}
          <a
            href="/api/auth/naver/login"
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#03C75A] py-3 font-semibold text-white hover:brightness-95 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
            네이버로 로그인
          </a>

        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40">또는 이메일로 로그인</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* 이메일 로그인 */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
