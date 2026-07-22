import { mockUsers } from "@/lib/mock-data";
import type { Account, Role } from "@/types";

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

export function login(email: string, password: string): Account | null {
  const match = mockUsers.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password
  );
  if (!match) return null;
  setSession(match.account);
  return match.account;
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
