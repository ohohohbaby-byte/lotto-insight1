"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AppUser = {
  id: string;
  email: string;
  name: string;
  isPremium: boolean;
  isAdmin: boolean;
};

type AuthMockContextType = {
  user: AppUser | null;
  login: () => void;
  logout: () => Promise<void>;
  upgradeToPremium: () => void;
  toggleAdmin: () => void;
};

const AuthMockContext = createContext<AuthMockContextType | undefined>(undefined);

function getRoleStorageKey(userId: string) {
  return `lotto-role-flags-${userId}`;
}

function loadRoleFlags(userId: string) {
  if (typeof window === "undefined") {
    return { isPremium: false, isAdmin: false };
  }

  const raw = localStorage.getItem(getRoleStorageKey(userId));
  if (!raw) {
    return { isPremium: false, isAdmin: false };
  }

  try {
    return JSON.parse(raw) as { isPremium: boolean; isAdmin: boolean };
  } catch {
    return { isPremium: false, isAdmin: false };
  }
}

function saveRoleFlags(userId: string, flags: { isPremium: boolean; isAdmin: boolean }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getRoleStorageKey(userId), JSON.stringify(flags));
}

function buildUserFromSession(sessionUser: {
  id: string;
  email?: string;
}): AppUser {
  const email = sessionUser.email ?? "";
  const name = email ? email.split("@")[0] : "회원";
  const flags = loadRoleFlags(sessionUser.id);

  return {
    id: sessionUser.id,
    email,
    name,
    isPremium: flags.isPremium,
    isAdmin: flags.isAdmin,
  };
}

export function AuthMockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const loadInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(buildUserFromSession(session.user));
      } else {
        setUser(null);
      }
    };

    loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(buildUserFromSession(session.user));
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,

      login: () => {
        window.location.href = "/login";
      },

      logout: async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
      },

      upgradeToPremium: () => {
        if (!user) {
          window.location.href = "/login";
          return;
        }

        const nextFlags = {
          isPremium: true,
          isAdmin: user.isAdmin,
        };

        saveRoleFlags(user.id, nextFlags);

        setUser({
          ...user,
          isPremium: true,
        });
      },

      toggleAdmin: () => {
        if (!user) {
          window.location.href = "/login";
          return;
        }

        const nextFlags = {
          isPremium: user.isPremium,
          isAdmin: !user.isAdmin,
        };

        saveRoleFlags(user.id, nextFlags);

        setUser({
          ...user,
          isAdmin: !user.isAdmin,
        });
      },
    }),
    [user]
  );

  return (
    <AuthMockContext.Provider value={value}>
      {children}
    </AuthMockContext.Provider>
  );
}

export function useAuthMock() {
  const context = useContext(AuthMockContext);

  if (!context) {
    throw new Error("useAuthMock must be used within AuthMockProvider");
  }

  return context;
}