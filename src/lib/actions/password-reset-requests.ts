"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public self-service "forgot password" — no login required, since the whole point is the
 * student is locked out. Always returns ok regardless of whether the email matches an account,
 * so this can't be used to probe which emails are registered.
 */
export async function createPasswordResetRequestAction(email: string): Promise<{ ok: true }> {
  const trimmed = email.trim().toLowerCase();
  if (EMAIL_PATTERN.test(trimmed)) {
    const account = await prisma.account.findUnique({ where: { email: trimmed } });
    if (account) {
      const existing = await prisma.passwordResetRequest.findFirst({
        where: { accountId: account.id_login, status: "pending" },
      });
      if (!existing) {
        await prisma.passwordResetRequest.create({ data: { accountId: account.id_login } });
      }
    }
  }
  return { ok: true };
}

export interface PendingResetRequest {
  id: string;
  accountId: string;
  fullName: string;
  email: string;
  createdAt: string;
}

/** Admin: every pending request across the whole app. */
export async function listAllResetRequestsAction(): Promise<PendingResetRequest[]> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return [];

  const rows = await prisma.passwordResetRequest.findMany({
    where: { status: "pending" },
    include: { account: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    fullName: r.account.fullName,
    email: r.account.email,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Lets an admin dismiss a request without resetting the password (e.g. handled another way, or
 * submitted by mistake). Actually resetting the password auto-resolves the request too. */
export async function dismissResetRequestAction(id: string): Promise<boolean> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return false;

  const updated = await prisma.passwordResetRequest
    .update({ where: { id }, data: { status: "resolved", resolvedAt: new Date() } })
    .catch(() => null);
  return updated !== null;
}
