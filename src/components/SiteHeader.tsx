"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type HeaderUser = {
  email: string;
  name: string;
  role: string;
  isPremium: boolean;
};

type NavItem = {
  label: string;
  href: string;
  key: string;
  premiumOnly?: boolean;
};

function PremiumBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border border-[#d4af37]/35",
        "bg-[#d4af37]/15 px-2 py-0.5 text-[10px] font-bold text-[#f1d17a]",
        className,
      ].join(" ")}
    >
      <span className="text-[11px] leading-none">👑</span>
      PREMIUM
    </span>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();

  const [user, setUser] = useState<HeaderUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { key: "tools", label: "분석 도구", href: "/numbers" },
      { key: "stats", label: "당첨 통계", href: "/lotto" },
      // TODO: AI 패턴 페이지 생기면 href만 바꾸면 됨
      { key: "ai", label: "AI 패턴", href: "/" },
      { key: "premium", label: "프리미엄", href: "/premium" },
      { key: "mylotto", label: "MY 로또", href: "/my-lotto" },
      { key: "mysub", label: "MY 구독", href: "/my-subscription", premiumOnly: true },
      { key: "admin", label: "관리자", href: "/admin", premiumOnly: true },
    ],
    []
  );

  const loadUser = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, nickname, role, is_premium")
        .eq("id", authUser.id)
        .single();

      setUser({
        email: authUser.email ?? "",
        name:
          profile?.nickname ||
          profile?.name ||
          authUser.email?.split("@")[0] ||
          "회원",
        role: profile?.role || "user",
        isPremium: !!profile?.is_premium,
      });
    } catch (error) {
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 페이지 이동 시 모바일 메뉴 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const visibleNavItems = navItems.filter((item) => {
    if (item.key === "mysub") return !!user; // 로그인한 유저만
    if (item.key === "admin") return user?.role === "admin";
    return true;
  });

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1020]/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4af37] font-bold text-[#11182b] shadow-[0_0_0_1px_rgba(212,175,55,0.25)]">
            L
          </div>
          <div className="leading-tight">
            <h1 className="text-lg font-bold tracking-wide text-white sm:text-xl">
              LOTTO INSIGHT
            </h1>
            <p className="text-xs text-white/60">Data-driven lotto analysis</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 text-sm text-white/85 md:flex">
          {visibleNavItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.key}
                href={item.href}
                className={[
                  "group relative inline-flex items-center gap-2 rounded-full px-4 py-2",
                  "transition-colors",
                  active
                    ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                    : "hover:bg-white/5 hover:text-white",
                ].join(" ")}
              >
                <span className={active ? "font-semibold" : "font-medium"}>
                  {item.label}
                </span>

                {/* 프리미엄 유저면 메뉴 옆 배지 */}
                {item.key === "premium" && user?.isPremium && (
                  <PremiumBadge className="ml-1" />
                )}

                {/* active underline glow */}
                {active && (
                  <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side (Desktop) */}
        <div className="hidden md:block">
          {loading ? (
            <div className="text-sm text-white/50">불러오는 중...</div>
          ) : !user ? (
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                로그인
              </Link>

              <Link
                href="/signup"
                className="rounded-md bg-[#d4af37] px-4 py-2 text-sm font-semibold text-[#11182b] hover:brightness-110"
              >
                회원가입
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-[#f1d17a]">
                  {user.name}
                </p>

                <div className="mt-1 flex items-center justify-end gap-2">
                  {user.isPremium ? (
                    <PremiumBadge />
                  ) : (
                    <span className="text-xs text-white/50">일반 회원</span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* Mobile button */}
        <button
          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10 md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? (
            // X icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            // Hamburger icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden">
          <div className="border-t border-white/10 bg-[#0b1020]/95 px-4 py-4">
            <div className="grid gap-2">
              {visibleNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={[
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm",
                      active
                        ? "bg-white/10 text-white"
                        : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                  >
                    <span className={active ? "font-semibold" : "font-medium"}>
                      {item.label}
                    </span>
                    {item.key === "premium" && user?.isPremium && (
                      <PremiumBadge />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              {loading ? (
                <div className="text-sm text-white/50">불러오는 중...</div>
              ) : !user ? (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/85 hover:bg-white/10"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 rounded-xl bg-[#d4af37] px-4 py-3 text-center text-sm font-bold text-[#11182b] hover:brightness-110"
                  >
                    회원가입
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#f1d17a]">
                      {user.name}
                    </p>
                    <div className="mt-1">
                      {user.isPremium ? (
                        <PremiumBadge />
                      ) : (
                        <span className="text-xs text-white/50">일반 회원</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/10"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
