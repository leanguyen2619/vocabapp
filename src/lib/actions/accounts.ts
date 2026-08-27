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

// Bounded quantifiers (not `+`) so this also caps length — an unbounded pattern would accept an
// arbitrarily long string as a valid "email" as long as it has no whitespace/@ before the last dot.
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const MAX_FULL_NAME_LENGTH = 100;

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
  if (fullName.length > MAX_FULL_NAME_LENGTH) return { error: "Họ tên quá dài." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Email không hợp lệ." };
  if (input.password.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) return { error: "Email này đã được sử dụng." };

  if (input.classId) {
    const classExists = await prisma.schoolClass.findUnique({ where: { id: input.classId } });
    if (!classExists) return { error: "Lớp học không hợp lệ." };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  // generateLoginId picks the next sequential ID from a COUNT query, so two concurrent creates
  // (double-click, two admin tabs) can compute the same id_login. Retry with a fresh ID on
  // collision rather than surfacing a raw unique-constraint 500.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const id_login = await generateLoginId(input.role);
    const account = await prisma.account
      .create({
        data: { id_login, fullName, email, role: input.role, passwordHash, classId: input.classId },
      })
      .catch((e: unknown) => {
        const code = (e as { code?: string } | null)?.code;
        if (code === "P2002") return null;
        throw e;
      });
    if (account) return { id_login: account.id_login };
  }

  return { error: "Không thể tạo mã tài khoản, vui lòng thử lại." };
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

  await prisma.passwordResetRequest.updateMany({
    where: { accountId: id_login, status: "pending" },
    data: { status: "resolved", resolvedAt: new Date() },
  });

  return {};
}

/** A locked account's active session is rejected on its very next request (see getCurrentAccount). */
export async function setAccountStatusAction(id_login: string, status: AccountStatus): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  // Deactivating never applies to the caller's own account — an admin could otherwise lock
  // themselves out immediately (the session is rejected on the very next request).
  if (status !== "active" && id_login === admin.id_login) return false;

  // Never allow the last active admin to be locked — that would leave the panel with no way
  // for anyone to unlock accounts again.
  if (status !== "active") {
    const target = await prisma.account.findUnique({ where: { id_login } });
    if (target?.role === "admin") {
      const activeAdminCount = await prisma.account.count({ where: { role: "admin", status: "active" } });
      if (activeAdminCount <= 1) return false;
    }
  }

  const updated = await prisma.account.update({ where: { id_login }, data: { status } }).catch(() => null);
  return updated !== null;
}

/** Edits an existing account's name and/or class assignment (e.g. assigning a teacher to a class). */
export async function updateAccountByAdminAction(
  id_login: string,
  patch: { fullName: string; classId: string | null }
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const fullName = patch.fullName.trim();
  if (!fullName) return { error: "Vui lòng nhập họ và tên." };
  if (fullName.length > MAX_FULL_NAME_LENGTH) return { error: "Họ tên quá dài." };

  if (patch.classId) {
    const classExists = await prisma.schoolClass.findUnique({ where: { id: patch.classId } });
    if (!classExists) return { error: "Lớp học không hợp lệ." };
  }

  const updated = await prisma.account
    .update({ where: { id_login }, data: { fullName, classId: patch.classId } })
    .catch(() => null);
  if (!updated) return { error: "Không tìm thấy tài khoản." };

  return {};
}
