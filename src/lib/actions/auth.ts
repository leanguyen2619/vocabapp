"use server";

import bcrypt from "bcryptjs";

import { generateLoginId } from "@/lib/id-gen";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentAccount } from "@/lib/session";
import type { Role } from "@/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthResult = { error: string } | { error?: undefined; id_login: string };

/** Students/teachers/admins log in with their email, not id_login. */
export async function loginAction(email: string, password: string): Promise<AuthResult> {
  const account = await prisma.account.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!account) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }
  if (account.status !== "active") {
    return { error: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên." };
  }

  const passwordMatches = await bcrypt.compare(password, account.passwordHash);
  if (!passwordMatches) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  await createSession(account.id_login);
  return { id_login: account.id_login };
}

export async function registerAction(input: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
}): Promise<AuthResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) return { error: "Vui lòng nhập họ và tên." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Email không đúng định dạng." };
  if (input.password.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  if (input.role !== "student" && input.role !== "teacher") return { error: "Vai trò không hợp lệ." };

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) return { error: "Email này đã được sử dụng." };

  const id_login = await generateLoginId(input.role);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const account = await prisma.account.create({
    data: { id_login, fullName, email, role: input.role, passwordHash },
  });

  await createSession(account.id_login);
  return { id_login: account.id_login };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}

/** Re-derives identity from the session cookie, not from any client-supplied id. */
export async function updateFullNameAction(
  fullName: string
): Promise<{ error: string } | { error?: undefined; fullName: string }> {
  const session = await getCurrentAccount();
  if (!session) return { error: "Bạn chưa đăng nhập." };

  const trimmed = fullName.trim();
  if (!trimmed) return { error: "Họ tên không được để trống." };

  await prisma.account.update({ where: { id_login: session.id_login }, data: { fullName: trimmed } });
  return { fullName: trimmed };
}

/** Re-derives identity from the session cookie, not from any client-supplied id. */
export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<{ error: string } | { error?: undefined }> {
  const session = await getCurrentAccount();
  if (!session) return { error: "Bạn chưa đăng nhập." };

  const account = await prisma.account.findUnique({ where: { id_login: session.id_login } });
  if (!account) return { error: "Bạn chưa đăng nhập." };

  const currentMatches = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!currentMatches) return { error: "Mật khẩu hiện tại không đúng." };

  if (newPassword.length < 6) return { error: "Mật khẩu mới cần ít nhất 6 ký tự." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.account.update({ where: { id_login: session.id_login }, data: { passwordHash } });
  return {};
}
