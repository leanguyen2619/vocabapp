import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import type { Account } from "@/generated/prisma/client";

export const SESSION_COOKIE_NAME = "vocabapp_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionAccount = Omit<Account, "passwordHash">;

/** Call only from a Server Action / Route Handler (cookies can't be set during render). */
export async function createSession(accountId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await prisma.session.create({ data: { accountId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Reads the session cookie and joins back to Account.status on every call, so a locked/banned
 * account is invalidated on its very next request without any separate revalidation step.
 */
export async function getCurrentAccount(): Promise<SessionAccount | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { account: { omit: { passwordHash: true } } },
  });

  if (!session || session.expiresAt < new Date() || session.account.status !== "active") {
    return null;
  }

  return session.account;
}

/** Call only from a Server Action / Route Handler. */
export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}
