"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentAccount } from "@/lib/session";

const MAX_FULL_NAME_LENGTH = 100;

type AuthResult = { error: string } | { error?: undefined; id_login: string };

/** Students and admins log in with their email, not id_login. */
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
  if (trimmed.length > MAX_FULL_NAME_LENGTH) return { error: "Họ tên quá dài." };

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

const AVATAR_DATA_URL_PATTERN = /^data:image\/(jpeg|png);base64,/;
// The client resizes to a small square before encoding, so a real upload is only a few KB — this
// generously bounds the request in case someone calls the action directly, bypassing that resize.
const MAX_AVATAR_DATA_URL_LENGTH = 300_000;

/** Re-derives identity from the session cookie, not from any client-supplied id. */
export async function updateAvatarAction(
  dataUrl: string
): Promise<{ error: string } | { error?: undefined; avatarUrl: string }> {
  const session = await getCurrentAccount();
  if (!session) return { error: "Bạn chưa đăng nhập." };

  if (!AVATAR_DATA_URL_PATTERN.test(dataUrl)) {
    return { error: "Ảnh không hợp lệ. Vui lòng chọn file JPEG hoặc PNG." };
  }
  if (dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    return { error: "Ảnh quá lớn. Vui lòng chọn ảnh khác." };
  }

  await prisma.account.update({ where: { id_login: session.id_login }, data: { avatarUrl: dataUrl } });
  return { avatarUrl: dataUrl };
}

/** Re-derives identity from the session cookie, not from any client-supplied id. */
export async function removeAvatarAction(): Promise<{ error: string } | { error?: undefined }> {
  const session = await getCurrentAccount();
  if (!session) return { error: "Bạn chưa đăng nhập." };

  await prisma.account.update({ where: { id_login: session.id_login }, data: { avatarUrl: null } });
  return {};
}
