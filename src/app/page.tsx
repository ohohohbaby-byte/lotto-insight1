"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [termsRequired, setTermsRequired] = useState(false);
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const allChecked = termsRequired && termsPrivacy && isAdult;

  const handleAllCheck = () => {
    const next = !allChecked;
    setTermsRequired(next);
    setTermsPrivacy(next);
    setIsAdult(next);
  };

  const validateForm = () => {
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!password.trim()) return "비밀번호를 입력해주세요.";
    if (!passwordConfirm.trim()) return "비밀번호 확인을 입력해주세요.";
    if (!username.trim()) return "아이디를 입력해주세요.";
    if (!name.trim()) return "이름을 입력해주세요.";
    if (!nickname.trim()) return "닉네임을 입력해주세요.";
    if (password.length < 6) return "비밀번호는 6자 이상 입력해주세요.";
    if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    if (!termsRequired) return "이용약관에 동의해주세요.";
    if (!termsPrivacy) return "개인정보처리방침에 동의해주세요.";
    if (!isAdult) return "만 19세 이상만 가입 가능합니다.";
    return null;
  };

  const handleSignup = async () => {
    setMessage("");
    const validationError = validateForm();
    if (validationError) { setMessage(validationError); return; }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) { setMessage(error.message); return; }

      const userId = data.user?.id;
      if (!userId) { setMessage("회원가입은 되었지만 사용자 정보를 확인할 수 없습니다."); return; }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username, name, nickname,
          provider: "email",
          is_adult: true,
          terms_required: true,
          terms_privacy: true,
          terms_marketing: false,
          terms_sms: false,
          terms_email: false,
        })
        .eq("id", userId);

      if (profileError) {
        setMessage(`회원가입은 되었지만 프로필 저장 중 오류: ${profileError.message}`);
        return;
      }

      setMessage("회원가입 성공! 로그인 페이지로 이동합니다.");
      setTimeout(() => { router.push("/login"); }, 1000);
    } catch (err) {
      console.error(err);
      setMessage("알 수 없는 오류가 발생했습니다.");
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
          <h1 className="text-3xl font-bold text-white">회원가입</h1>
          <p className="mt-2 text-sm text-slate-400">
            LOTTO INSIGHT 회원 정보를 입력해주세요.
          </p>
        </div>

        {/* 소셜 가입 버튼 */}
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
            {socialLoading === "google" ? "처리 중..." : "Google로 시작하기"}
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
            {socialLoading === "kakao" ? "처리 중..." : "카카오로 시작하기"}
          </button>

          {/* 네이버 */}
          <a
            href="/api/auth/naver/login"
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#03C75A] py-3 font-semibold text-white hover:brightness-95 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
            </svg>
            네이버로 시작하기
          </a>

        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/40">또는 이메일로 가입</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* 이메일 가입 폼 */}
        <div className="space-y-4">
          <input type="email" placeholder="이메일" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60" />
          <input type="password" placeholder="비밀번호 (6자 이상)" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60" />
          <input type="password" placeholder="비밀번호 확인" value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60" />
          <input type="text" placeholder="아이디" value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60" />
          <input type="text" placeholder="이름" value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60" />
          <input type="text" placeholder="닉네임" value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60" />

          {/* 약관 동의 */}
          <div className="rounded-xl border border-white/10 bg-[#111c33] p-4 text-sm text-slate-300 space-y-3">
            {/* 전체 동의 */}
            <label className="flex items-center gap-2 font-semibold text-white cursor-pointer">
              <input type="checkbox" checked={allChecked} onChange={handleAllCheck}
                className="w-4 h-4 accent-[#d4af37]" />
              <span>전체 동의</span>
            </label>
            <div className="h-px bg-white/10" />

            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={termsRequired}
                  onChange={(e) => setTermsRequired(e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37]" />
                <span>[필수] 이용약관 동의</span>
              </div>
              <Link href="/terms" target="_blank"
                className="text-xs text-[#d4af37] hover:underline shrink-0">보기</Link>
            </label>

            <label className="flex items-center justify-between gap-2 cursor-pointer">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={termsPrivacy}
                  onChange={(e) => setTermsPrivacy(e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37]" />
                <span>[필수] 개인정보처리방침 동의</span>
              </div>
              <Link href="/privacy" target="_blank"
                className="text-xs text-[#d4af37] hover:underline shrink-0">보기</Link>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
                className="w-4 h-4 accent-[#d4af37]" />
              <span>[필수] 만 19세 이상입니다.</span>
            </label>
          </div>

          <button onClick={handleSignup} disabled={loading}
            className="w-full rounded-xl bg-[#d4af37] py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "가입 처리 중..." : "회원가입"}
          </button>

          {message && (
            <p className="text-center text-sm text-[#f0c85a]">{message}</p>
          )}

          <div className="pt-2 text-center text-sm text-slate-400">
            이미 계정이 있으신가요?{" "}
            <button type="button" onClick={() => router.push("/login")}
              className="font-semibold text-[#d4af37] hover:underline">
              로그인
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
