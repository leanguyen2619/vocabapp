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
      autoUnlockNextAt: level.autoUnlockNextAt,
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

// Bounded, not "every student ever enrolled" — feeds a plain <Select> on the admin levels page,
// which would otherwise re-fetch and render an ever-growing list on every page load.
const STUDENTS_LIST_CAP = 2000;

export async function listStudentsAction(): Promise<StudentSummary[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const rows = await prisma.account.findMany({
    where: { role: "student" },
    orderBy: { fullName: "asc" },
    take: STUDENTS_LIST_CAP,
  });
  return rows.map((r) => ({ id_login: r.id_login, fullName: r.fullName, email: r.email }));
}

export interface AccountLevelEntry {
  status: AccountLevelStatus;
  manualNote: string | null;
}

export async function getAccountLevelStatusesAction(
  accountId: string
): Promise<Record<string, AccountLevelEntry>> {
  const admin = await requireAdmin();
  if (!admin) return {};

  const [levels, entries] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId } }),
  ]);

  const map: Record<string, AccountLevelEntry> = {};
  levels.forEach((l) => {
    const entry = entries.find((e) => e.levelId === l.id);
    map[l.id] = { status: entry?.status ?? "locked", manualNote: entry?.manualNote ?? null };
  });
  return map;
}

export interface LevelUnlockCandidate {
  accountId: string;
  fullName: string;
  email: string;
  completedLevelName: string;
  nextLevelId: string;
  nextLevelName: string;
}

/**
 * Students who fully completed a level but the next one is still locked — level progression is
 * intentionally manual (an admin must review and unlock each next level), so this is purely a
 * discoverability aid: without it an admin has no way to know who's waiting without opening every
 * student one by one. Reports only the earliest pending gap per student, since a level can only
 * naturally become "completed" through practice, which is impossible while it's still locked.
 */
export async function listLevelUnlockCandidatesAction(): Promise<LevelUnlockCandidate[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const [levels, students, accountLevels] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.account.findMany({
      where: { role: "student" },
      orderBy: { fullName: "asc" },
      take: STUDENTS_LIST_CAP,
    }),
    prisma.accountLevel.findMany(),
  ]);

  // A Map keyed by "accountId:levelId" turns each lookup below into O(1) instead of an
  // O(accountLevels-per-student) .find() re-scanned for every (student, level) pair — the
  // previous version was effectively O(students × levels × accountLevels-per-student).
  const statusByKey = new Map(accountLevels.map((al) => [`${al.accountId}:${al.levelId}`, al.status]));

  const candidates: LevelUnlockCandidate[] = [];
  for (const student of students) {
    for (let i = 0; i < levels.length - 1; i++) {
      const current = levels[i];
      const next = levels[i + 1];
      const currentStatus = statusByKey.get(`${student.id_login}:${current.id}`) ?? "locked";
      const nextStatus = statusByKey.get(`${student.id_login}:${next.id}`) ?? "locked";
      if (currentStatus === "completed" && nextStatus === "locked") {
        candidates.push({
          accountId: student.id_login,
          fullName: student.fullName,
          email: student.email,
          completedLevelName: current.level,
          nextLevelId: next.id,
          nextLevelName: next.level,
        });
        break;
      }
    }
  }
  return candidates;
}

/** Sets (or clears, with null) the % mastery threshold at which this level silently unlocks the
 * next one for every student — see the Level.autoUnlockNextAt comment in schema.prisma and the
 * auto-unlock branch in recordForVocab. Does not touch this level's own maxScore/completion
 * display; only affects whether/when the FOLLOWING level opens up on its own. */
export async function setLevelAutoUnlockThresholdAction(
  levelId: string,
  threshold: number | null
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;
  if (threshold !== null && (!Number.isInteger(threshold) || threshold < 1 || threshold > 100)) return false;

  const updated = await prisma.level
    .update({ where: { id: levelId }, data: { autoUnlockNextAt: threshold } })
    .catch(() => null);
  return updated !== null;
}

export async function setAccountLevelStatusAction(
  accountId: string,
  levelId: string,
  status: AccountLevelStatus,
  manualNote?: string
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  // A truthy check on manualNote would treat "" (the admin deliberately clearing the note) the
  // same as "nothing to update", so the update clause silently drops the field and the old note
  // stays in the DB forever — checking `!== undefined` instead lets "" through to actually clear
  // it (as null, matching the column's own empty-note representation), while a genuinely omitted
  // argument still leaves the existing note untouched.
  const updated = await prisma.accountLevel
    .upsert({
      where: { accountId_levelId: { accountId, levelId } },
      update: { status, ...(manualNote !== undefined ? { manualNote: manualNote || null } : {}) },
      create: { accountId, levelId, status, manualNote: manualNote || null, score: 0, streak: 0 },
    })
    .catch(() => null);
  return updated !== null;
}
