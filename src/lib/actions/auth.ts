"use server";

import bcrypt from "bcryptjs";

import { generateLoginId } from "@/lib/id-gen";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentAccount } from "@/lib/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/**
 * Public self-registration is student-only by design — an admin account grants access to every
 * student's real data and management functions, so it must be created by an existing admin (see
 * createAccountByAdminAction) rather than claimed by anyone who finds this form.
 */
export async function registerAction(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();

  if (!fullName) return { error: "Vui lòng nhập họ và tên." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Email không đúng định dạng." };
  if (input.password.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };

  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) return { error: "Email này đã được sử dụng." };

  const passwordHash = await bcrypt.hash(input.password, 10);

  // generateLoginId picks the next sequential ID from a COUNT query, so two concurrent
  // registrations (double-submit, two tabs) can compute the same id_login. Retry with a fresh ID
  // on collision rather than surfacing a raw unique-constraint 500.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const id_login = await generateLoginId("student");
    const account = await prisma.account
      .create({ data: { id_login, fullName, email, role: "student", passwordHash } })
      .catch((e: unknown) => {
        const code = (e as { code?: string } | null)?.code;
        if (code === "P2002") return null;
        throw e;
      });
    if (account) {
      await createSession(account.id_login);
      return { id_login: account.id_login };
    }
  }

  return { error: "Không thể tạo tài khoản, vui lòng thử lại." };
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
