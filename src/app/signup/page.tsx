"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");

  const [termsRequired, setTermsRequired] = useState(false);
  const [isAdult, setIsAdult] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const validateForm = () => {
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!password.trim()) return "비밀번호를 입력해주세요.";
    if (!passwordConfirm.trim()) return "비밀번호 확인을 입력해주세요.";
    if (!username.trim()) return "아이디를 입력해주세요.";
    if (!name.trim()) return "이름을 입력해주세요.";
    if (!nickname.trim()) return "닉네임을 입력해주세요.";

    if (password.length < 6) {
      return "비밀번호는 6자 이상 입력해주세요.";
    }

    if (password !== passwordConfirm) {
      return "비밀번호가 일치하지 않습니다.";
    }

    if (!termsRequired) {
      return "필수 약관에 동의해주세요.";
    }

    if (!isAdult) {
      return "만 19세 이상만 가입 가능합니다.";
    }

    return null;
  };

  const handleSignup = async () => {
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);

      // 1) auth 회원가입
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      const userId = data.user?.id;

      if (!userId) {
        setMessage("회원가입은 되었지만 사용자 정보를 확인할 수 없습니다.");
        return;
      }

      // 2) profiles 추가 정보 업데이트
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          username,
          name,
          nickname,
          provider: "email",
          is_adult: true,
          terms_required: true,
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
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      console.error(err);
      setMessage("알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
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

          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60"
          />

          <input
            type="text"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60"
          />

          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60"
          />

          <input
            type="text"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#111c33] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#d4af37]/60"
          />

          <div className="rounded-xl border border-white/10 bg-[#111c33] p-4 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={termsRequired}
                onChange={(e) => setTermsRequired(e.target.checked)}
              />
              <span>[필수] 이용약관 및 개인정보 수집에 동의합니다.</span>
            </label>

            <label className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
              />
              <span>만 19세 이상입니다.</span>
            </label>
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-xl bg-[#d4af37] py-3 font-bold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "가입 처리 중..." : "회원가입"}
          </button>

          {message && (
            <p className="text-center text-sm text-[#f0c85a]">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}