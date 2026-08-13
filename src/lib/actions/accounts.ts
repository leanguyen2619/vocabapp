"use server";

import bcrypt from "bcryptjs";

import { generateLoginId } from "@/lib/id-gen";
import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { Account, AccountStatus, Role } from "@/types";

export interface AccountSummary {
  account: Account;
  email: string;
}

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function listAccountsAction(): Promise<AccountSummary[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const rows = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((r) => ({
    account: {
      id_login: r.id_login,
      fullName: r.fullName,
      role: r.role,
      status: r.status,
      classId: r.classId,
      avatarUrl: r.avatarUrl,
    },
    email: r.email,
  }));
}

export async function createAccountByAdminAction(input: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  classId: string | null;
}): Promise<{ error: string } | { error?: undefined; id_login: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName || !email || !input.password) return { error: "Vui lòng điền đầy đủ thông tin." };
  if (input.password.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) return { error: "Email này đã được sử dụng." };

  const id_login = await generateLoginId(input.role);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const account = await prisma.account.create({
    data: { id_login, fullName, email, role: input.role, passwordHash, classId: input.classId },
  });

  return { id_login: account.id_login };
}

export async function resetPasswordByAdminAction(
  id_login: string,
  newPassword: string
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };
  if (newPassword.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await prisma.account
    .update({ where: { id_login }, data: { passwordHash } })
    .catch(() => null);
  if (!updated) return { error: "Không tìm thấy tài khoản." };

  return {};
}

/** A locked account's active session is rejected on its very next request (see getCurrentAccount). */
export async function setAccountStatusAction(id_login: string, status: AccountStatus): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const updated = await prisma.account.update({ where: { id_login }, data: { status } }).catch(() => null);
  return updated !== null;
}
