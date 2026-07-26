import { mockUsers } from "@/lib/mock-data";
import type { Account, AccountStatus, Role } from "@/types";

const SESSION_KEY = "vocabapp_session";

/**
 * Demo-only session storage. There is no backend, so "auth" here just
 * persists the logged-in Account to localStorage on the client.
 */
export function getSession(): Account | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Account;
  } catch {
    return null;
  }
}

export function setSession(account: Account) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function login(email: string, password: string): { account: Account | null; error?: string } {
  const match = mockUsers.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
  );
  if (!match) {
    return { account: null, error: "Email hoặc mật khẩu không đúng." };
  }
  if (match.account.status !== "active") {
    return { account: null, error: "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên." };
  }
  setSession(match.account);
  return { account: match.account };
}

export function register(input: { fullName: string; email: string; password: string; role: Role }): Account {
  const account: Account = {
    id_login: `acc_${Date.now()}`,
    fullName: input.fullName,
    role: input.role,
    status: "active",
    classId: null,
  };
  mockUsers.push({ email: input.email, password: input.password, account });
  setSession(account);
  return account;
}

export function isEmailTaken(email: string): boolean {
  return mockUsers.some((user) => user.email.toLowerCase() === email.trim().toLowerCase());
}

export function getEmailForAccount(id_login: string): string | null {
  return mockUsers.find((user) => user.account.id_login === id_login)?.email ?? null;
}

export function updateAccount(id_login: string, patch: Partial<Pick<Account, "fullName">>): Account | null {
  const match = mockUsers.find((user) => user.account.id_login === id_login);
  if (!match) return null;
  match.account = { ...match.account, ...patch };
  setSession(match.account);
  return match.account;
}

export interface AccountSummary {
  account: Account;
  email: string;
}

export function listAccounts(): AccountSummary[] {
  return mockUsers.map((user) => ({ account: user.account, email: user.email }));
}

/** Admin-initiated account creation — does NOT sign the admin out into the new account. */
export function createAccountByAdmin(input: {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  classId: string | null;
}): Account {
  const account: Account = {
    id_login: `acc_${Date.now()}`,
    fullName: input.fullName,
    role: input.role,
    status: "active",
    classId: input.classId,
  };
  mockUsers.push({ email: input.email, password: input.password, account });
  return account;
}

export function resetPasswordByAdmin(id_login: string): string | null {
  const match = mockUsers.find((user) => user.account.id_login === id_login);
  if (!match) return null;
  const newPassword = Math.random().toString(36).slice(-8);
  match.password = newPassword;
  return newPassword;
}

export function setAccountStatus(id_login: string, status: AccountStatus): Account | null {
  const match = mockUsers.find((user) => user.account.id_login === id_login);
  if (!match) return null;
  match.account = { ...match.account, status };
  return match.account;
}
