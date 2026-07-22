"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { clearSession, getSession, updateAccount } from "@/lib/auth";
import type { Account } from "@/types";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionState {
  account: Account | null;
  status: SessionStatus;
}

export function useSession() {
  const [state, setState] = useState<SessionState>({ account: null, status: "loading" });

  useEffect(() => {
    // Syncing from localStorage (an external system unavailable during SSR) — the
    // "loading" state above is what the server renders, avoiding a hydration mismatch.
    const session = getSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ account: session, status: session ? "authenticated" : "unauthenticated" });
  }, []);

  const logout = () => {
    clearSession();
    setState({ account: null, status: "unauthenticated" });
  };

  const updateProfile = (patch: Partial<Pick<Account, "fullName">>) => {
    if (!state.account) return;
    const updated = updateAccount(state.account.id_login, patch);
    if (updated) {
      setState({ account: updated, status: "authenticated" });
    }
  };

  return { account: state.account, status: state.status, logout, updateProfile };
}

/** Use on pages that require a logged-in demo session; redirects to /login otherwise. */
export function useRequireSession() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace("/login");
    }
  }, [session.status, router]);

  return session;
}
