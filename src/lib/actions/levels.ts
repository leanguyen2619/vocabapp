"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { AccountLevelStatus, Level, LevelWithProgress } from "@/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function listLevelsAction(): Promise<Level[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  return prisma.level.findMany({ orderBy: { id: "asc" } });
}

async function computeLevelsWithProgress(accountId: string): Promise<LevelWithProgress[]> {
  const [levels, accountLevels, vocabulary, learningHistory] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId } }),
    prisma.vocabulary.findMany({ select: { id: true, levelId: true } }),
    prisma.learningHistory.findMany({ where: { accountId }, select: { vocabId: true, status: true } }),
  ]);

  const masteredVocabIds = new Set(
    learningHistory.filter((h) => h.status === "mastered").map((h) => h.vocabId)
  );

  return levels.map((level) => {
    const entry = accountLevels.find((e) => e.levelId === level.id);
    const levelVocab = vocabulary.filter((v) => v.levelId === level.id);
    const totalVocab = levelVocab.length;
    const masteredVocab = levelVocab.filter((v) => masteredVocabIds.has(v.id)).length;
    const computedScore = totalVocab > 0 ? Math.round((masteredVocab / totalVocab) * 100) : 0;

    return {
      id: level.id,
      level: level.level,
      maxScore: level.maxScore,
      status: entry?.status ?? "locked",
      score: entry?.score ?? computedScore,
      streak: entry?.streak ?? 0,
      totalVocab,
      masteredVocab,
    };
  });
}

/** Current session account's own level progress — used by dashboard/profile/exercises. */
export async function getMyLevelsAction(): Promise<LevelWithProgress[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  return computeLevelsWithProgress(account.id_login);
}

/**
 * Highest unlocked level as an ordinal (A1=1, A2=2, ...). Used by the unlock logic: a
 * PracType is shown only when studentLevelIndex >= practiceType.level.
 */
export async function getMyStudentLevelIndexAction(): Promise<number> {
  const account = await getCurrentAccount();
  if (!account) return 1;

  const levels = await computeLevelsWithProgress(account.id_login);
  let current = 1;
  levels.forEach((level, index) => {
    if (level.status === "completed" || level.status === "in_progress") current = index + 1;
  });
  return current;
}

export interface StudentSummary {
  id_login: string;
  fullName: string;
  email: string;
}

export async function listStudentsAction(): Promise<StudentSummary[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const rows = await prisma.account.findMany({ where: { role: "student" }, orderBy: { fullName: "asc" } });
  return rows.map((r) => ({ id_login: r.id_login, fullName: r.fullName, email: r.email }));
}

export async function getAccountLevelStatusesAction(
  accountId: string
): Promise<Record<string, AccountLevelStatus>> {
  const admin = await requireAdmin();
  if (!admin) return {};

  const [levels, entries] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId } }),
  ]);

  const map: Record<string, AccountLevelStatus> = {};
  levels.forEach((l) => {
    map[l.id] = entries.find((e) => e.levelId === l.id)?.status ?? "locked";
  });
  return map;
}

export async function setAccountLevelStatusAction(
  accountId: string,
  levelId: string,
  status: AccountLevelStatus,
  manualNote?: string
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  await prisma.accountLevel.upsert({
    where: { accountId_levelId: { accountId, levelId } },
    update: { status, ...(manualNote ? { manualNote } : {}) },
    create: { accountId, levelId, status, manualNote, score: 0, streak: 0 },
  });
  return true;
}
