"use server";

import { prisma } from "@/lib/prisma";
import { computeUnlockedLevelIds } from "@/lib/level-unlock";
import { getCurrentAccount } from "@/lib/session";
import type { AssignmentStatus } from "@/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

/**
 * Picks the student's current level: the most advanced (highest-ordinal) level still
 * "in_progress", falling back to the most advanced "completed" one. `accountLevels` comes from a
 * query with no `orderBy`, so row order is not guaranteed — sorting explicitly by `levels`'
 * ordinal (rather than relying on whichever row Postgres returns first) keeps this deterministic
 * even if a student ever has more than one level marked in_progress (e.g. after a manual admin
 * override).
 */
function pickActiveLevel<T extends { levelId: string; status: string }>(
  levels: { id: string }[],
  accountLevels: T[]
): T | undefined {
  const ordinal = new Map(levels.map((l, i) => [l.id, i]));
  const sorted = [...accountLevels].sort(
    (a, b) => (ordinal.get(a.levelId) ?? 0) - (ordinal.get(b.levelId) ?? 0)
  );
  return (
    [...sorted].reverse().find((al) => al.status === "in_progress") ??
    [...sorted].reverse().find((al) => al.status === "completed")
  );
}

export interface StudentSummary {
  id_login: string;
  fullName: string;
  className: string | null;
  levelName: string;
  score: number;
  streak: number;
  masteredVocab: number;
  todayStatus: AssignmentStatus;
  pinnedTopicName: string | null;
  /** True once auto-continued assignment has run out of new words in the student's last-assigned
   * topic+level (see deriveLastAssignmentRule / Account.assignRuleExhaustedAt) — the admin needs
   * to manually assign from a different topic. Cleared by the next explicit assignment. */
  assignRuleExhausted: boolean;
}

/** Every student account, with real progress from Postgres — the admin manages the whole school,
 * not just one class, so this is deliberately not scoped by classId. */
export async function listAllStudentsAction(): Promise<StudentSummary[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const students = await prisma.account.findMany({
    where: { role: "student" },
    include: { class: true, pinnedTopic: true },
    orderBy: { fullName: "asc" },
  });
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id_login);
  const [levels, accountLevels, learningHistory] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId: { in: studentIds } } }),
    prisma.learningHistory.findMany({ where: { accountId: { in: studentIds } } }),
  ]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return students.map((s) => {
    const myLevels = accountLevels.filter((al) => al.accountId === s.id_login);
    const activeLevel = pickActiveLevel(levels, myLevels);
    const levelName = levels.find((l) => l.id === activeLevel?.levelId)?.level ?? levels[0]?.level ?? "-";

    const myHistory = learningHistory.filter((h) => h.accountId === s.id_login);
    const masteredVocab = myHistory.filter((h) => h.status === "mastered").length;
    const streak = Math.max(0, ...myLevels.map((al) => al.streak), 0);

    const todayHistory = myHistory.filter((h) => h.lastDate >= startOfToday);
    let todayStatus: AssignmentStatus = "pending";
    if (todayHistory.length > 0) {
      todayStatus = todayHistory.every((h) => h.status === "mastered") ? "done" : "in_progress";
    }

    return {
      id_login: s.id_login,
      fullName: s.fullName,
      className: s.class?.className ?? null,
      levelName,
      score: activeLevel?.score ?? 0,
      streak,
      masteredVocab,
      todayStatus,
      pinnedTopicName: s.pinnedTopic?.topic ?? null,
      assignRuleExhausted: s.assignRuleExhaustedAt !== null,
    };
  });
}

/** Persists a real assignment (DailyAssignment rows) for every current student. */
export async function assignVocabularyToAllStudentsAction(
  vocabIds: string[]
): Promise<{ error: string } | { error?: undefined; studentCount: number }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };
  if (vocabIds.length === 0) return { error: "Vui lòng chọn ít nhất 1 từ vựng." };

  const students = await prisma.account.findMany({
    where: { role: "student" },
    select: { id_login: true },
  });
  if (students.length === 0) return { error: "Chưa có học sinh nào trong hệ thống." };

  const assignedDate = new Date();
  assignedDate.setHours(0, 0, 0, 0);

  const data = students.flatMap((s) =>
    vocabIds.map((vocabId) => ({
      accountId: s.id_login,
      vocabId,
      assignedDate,
      status: "pending" as const,
    }))
  );

  const result = await prisma.dailyAssignment.createMany({ data, skipDuplicates: true }).catch(() => null);
  if (!result) return { error: "Một hoặc nhiều từ vựng đã chọn không còn hợp lệ. Vui lòng thử lại." };

  // A fresh explicit assignment gives every affected student's auto-continuation a new topic+level
  // to work from (see deriveLastAssignmentRule) — clear the exhausted flag so it can notify again
  // if this new batch also eventually runs out.
  await prisma.account.updateMany({
    where: { id_login: { in: students.map((s) => s.id_login) } },
    data: { assignRuleExhaustedAt: null },
  });

  return { studentCount: students.length };
}

/** Persists a real assignment (DailyAssignment rows) for exactly one student. */
export async function assignVocabularyToStudentAction(
  studentId: string,
  vocabIds: string[]
): Promise<{ error: string } | { error?: undefined; count: number }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };
  if (vocabIds.length === 0) return { error: "Vui lòng chọn ít nhất 1 từ vựng." };

  const student = await prisma.account.findFirst({ where: { id_login: studentId, role: "student" } });
  if (!student) return { error: "Không tìm thấy học sinh này." };

  const assignedDate = new Date();
  assignedDate.setHours(0, 0, 0, 0);

  const data = vocabIds.map((vocabId) => ({
    accountId: studentId,
    vocabId,
    assignedDate,
    status: "pending" as const,
  }));

  const result = await prisma.dailyAssignment.createMany({ data, skipDuplicates: true }).catch(() => null);
  if (!result) return { error: "Một hoặc nhiều từ vựng đã chọn không còn hợp lệ. Vui lòng thử lại." };

  // See the matching comment in assignVocabularyToAllStudentsAction.
  await prisma.account.update({ where: { id_login: studentId }, data: { assignRuleExhaustedAt: null } });

  return { count: result.count };
}

export interface AssignedVocabSummary {
  vocabId: string;
  vocab: string;
  meanVI: string;
  assignedDate: string;
  studentCount: number;
}

/** Distinct words currently assigned to any student, most recent first. */
export async function listAllAssignedVocabAction(): Promise<AssignedVocabSummary[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const assignments = await prisma.dailyAssignment.findMany({
    where: { account: { role: "student" } },
    include: { vocab: true },
  });

  // studentCount must count distinct students, not assignment rows — the same word can have
  // multiple rows per student (one per assignedDate) if it's re-assigned on a later day.
  const byVocab = new Map<
    string,
    { vocab: string; meanVI: string; assignedDate: Date; students: Set<string> }
  >();
  for (const a of assignments) {
    const existing = byVocab.get(a.vocabId);
    if (existing) {
      existing.students.add(a.accountId);
      if (a.assignedDate > existing.assignedDate) existing.assignedDate = a.assignedDate;
    } else {
      byVocab.set(a.vocabId, {
        vocab: a.vocab.vocab,
        meanVI: a.vocab.meanVI,
        assignedDate: a.assignedDate,
        students: new Set([a.accountId]),
      });
    }
  }

  return [...byVocab.entries()]
    .map(([vocabId, v]) => ({
      vocabId,
      vocab: v.vocab,
      meanVI: v.meanVI,
      assignedDate: v.assignedDate.toISOString(),
      studentCount: v.students.size,
    }))
    .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
}

/** Removes this word's assignment for every student who currently has it. */
export async function cancelAssignmentAction(vocabId: string): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  await prisma.dailyAssignment.deleteMany({ where: { vocabId, account: { role: "student" } } });
  return true;
}

export interface StudentDetail {
  id_login: string;
  fullName: string;
  email: string;
  levelName: string;
  score: number;
  streak: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  learningWords: { vocab: string; meanVI: string }[];
  pinnedTopicId: number | null;
  pinnedTopicName: string | null;
  dailyWordTargetOverride: number | null;
  classDailyWordTarget: number;
}

/** Full progress detail for one student. */
export async function getStudentDetailAction(studentId: string): Promise<StudentDetail | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const student = await prisma.account.findFirst({
    where: { id_login: studentId, role: "student" },
    include: { class: true, pinnedTopic: true },
  });
  if (!student) return null;

  const [levels, accountLevels, history, totalVocab] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId: studentId } }),
    prisma.learningHistory.findMany({ where: { accountId: studentId }, include: { vocab: true } }),
    prisma.vocabulary.count(),
  ]);

  const activeLevel = pickActiveLevel(levels, accountLevels);
  const levelName = levels.find((l) => l.id === activeLevel?.levelId)?.level ?? levels[0]?.level ?? "-";
  const streak = Math.max(0, ...accountLevels.map((al) => al.streak), 0);

  const masteredCount = history.filter((h) => h.status === "mastered").length;
  const learningEntries = history.filter((h) => h.status === "learning");

  return {
    id_login: student.id_login,
    fullName: student.fullName,
    email: student.email,
    levelName,
    score: activeLevel?.score ?? 0,
    streak,
    masteredCount,
    learningCount: learningEntries.length,
    newCount: Math.max(0, totalVocab - masteredCount - learningEntries.length),
    learningWords: learningEntries.slice(0, 20).map((h) => ({ vocab: h.vocab.vocab, meanVI: h.vocab.meanVI })),
    pinnedTopicId: student.pinnedTopicId,
    pinnedTopicName: student.pinnedTopic?.topic ?? null,
    dailyWordTargetOverride: student.dailyWordTargetOverride,
    classDailyWordTarget: student.class?.dailyWordTarget ?? 5,
  };
}

/** Pins a specific topic for one student's auto-assignment (see Account.pinnedTopicId /
 * pickTodaysWordIds) — stays in effect for every future day until changed or cleared. */
export async function pinTopicForStudentAction(
  studentId: string,
  topicId: number
): Promise<{ error: string } | { error?: undefined; topicName: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const [student, topic] = await Promise.all([
    prisma.account.findFirst({ where: { id_login: studentId, role: "student" } }),
    prisma.topic.findUnique({ where: { id: topicId } }),
  ]);
  if (!student) return { error: "Không tìm thấy học sinh này." };
  if (!topic) return { error: "Không tìm thấy chủ đề này." };

  await prisma.account.update({ where: { id_login: studentId }, data: { pinnedTopicId: topicId } });
  return { topicName: topic.topic };
}

/** Picks a random topic from among those with vocabulary in this student's currently unlocked
 * levels (so the pin is never immediately dead), then pins it exactly like pinTopicForStudentAction. */
export async function pinRandomTopicForStudentAction(
  studentId: string
): Promise<{ error: string } | { error?: undefined; topicName: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const student = await prisma.account.findFirst({ where: { id_login: studentId, role: "student" } });
  if (!student) return { error: "Không tìm thấy học sinh này." };

  const unlockedLevelIds = await computeUnlockedLevelIds(studentId);
  const vocab = await prisma.vocabulary.findMany({
    where: { levelId: { in: [...unlockedLevelIds] } },
    select: { topicId: true },
  });
  const topicIds = [...new Set(vocab.map((v) => v.topicId))];
  if (topicIds.length === 0) {
    return { error: "Học sinh chưa mở khóa chủ đề nào để chọn ngẫu nhiên." };
  }

  const topicId = topicIds[Math.floor(Math.random() * topicIds.length)]!;
  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  await prisma.account.update({ where: { id_login: studentId }, data: { pinnedTopicId: topicId } });
  return { topicName: topic?.topic ?? "" };
}

/** Clears a student's pinned topic — auto-assignment goes back to the normal sequential
 * curriculum order (see pickTodaysWordIds). */
export async function unpinTopicForStudentAction(studentId: string): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const updated = await prisma.account
    .update({ where: { id_login: studentId }, data: { pinnedTopicId: null } })
    .catch(() => null);
  return updated !== null;
}

/** Sets (or clears, with `target: null`) a per-student override for how many words are
 * auto-assigned per day — falls back to the student's class's dailyWordTarget when null. */
export async function setDailyWordTargetOverrideAction(
  studentId: string,
  target: number | null
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };
  if (target !== null && (!Number.isInteger(target) || target <= 0)) {
    return { error: "Số từ mỗi ngày phải là số nguyên dương." };
  }

  const student = await prisma.account.findFirst({ where: { id_login: studentId, role: "student" } });
  if (!student) return { error: "Không tìm thấy học sinh này." };

  await prisma.account.update({
    where: { id_login: studentId },
    data: { dailyWordTargetOverride: target },
  });
  return {};
}
