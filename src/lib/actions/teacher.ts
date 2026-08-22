"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { AssignmentStatus } from "@/types";

async function requireTeacher() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "teacher") return null;
  return account;
}

export interface ClassStudentSummary {
  id_login: string;
  fullName: string;
  levelName: string;
  score: number;
  streak: number;
  masteredVocab: number;
  todayStatus: AssignmentStatus;
}

/** Students in the signed-in teacher's assigned class, with real progress from Postgres. */
export async function getMyClassStudentsAction(): Promise<ClassStudentSummary[]> {
  const teacher = await requireTeacher();
  if (!teacher || !teacher.classId) return [];

  const students = await prisma.account.findMany({
    where: { classId: teacher.classId, role: "student" },
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
    const activeLevel =
      myLevels.find((al) => al.status === "in_progress") ??
      [...myLevels].reverse().find((al) => al.status === "completed");
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
      levelName,
      score: activeLevel?.score ?? 0,
      streak,
      masteredVocab,
      todayStatus,
    };
  });
}

/** Persists a real assignment (DailyAssignment rows) for every student in the teacher's class. */
export async function assignVocabularyToClassAction(
  vocabIds: string[]
): Promise<{ error: string } | { error?: undefined; studentCount: number }> {
  const teacher = await requireTeacher();
  if (!teacher) return { error: "Bạn không có quyền thực hiện thao tác này." };
  if (!teacher.classId) return { error: "Bạn chưa được gán vào lớp nào. Vui lòng liên hệ quản trị viên." };
  if (vocabIds.length === 0) return { error: "Vui lòng chọn ít nhất 1 từ vựng." };

  const students = await prisma.account.findMany({
    where: { classId: teacher.classId, role: "student" },
    select: { id_login: true },
  });
  if (students.length === 0) return { error: "Lớp của bạn chưa có học sinh nào." };

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

  await prisma.dailyAssignment.createMany({ data, skipDuplicates: true });

  return { studentCount: students.length };
}

export interface AssignedVocabSummary {
  vocabId: string;
  vocab: string;
  meanVI: string;
  assignedDate: string;
  studentCount: number;
}

/** Distinct words currently assigned to the teacher's class, most recent first. */
export async function listMyAssignedVocabAction(): Promise<AssignedVocabSummary[]> {
  const teacher = await requireTeacher();
  if (!teacher || !teacher.classId) return [];

  const students = await prisma.account.findMany({
    where: { classId: teacher.classId, role: "student" },
    select: { id_login: true },
  });
  const studentIds = students.map((s) => s.id_login);
  if (studentIds.length === 0) return [];

  const assignments = await prisma.dailyAssignment.findMany({
    where: { accountId: { in: studentIds } },
    include: { vocab: true },
  });

  const byVocab = new Map<string, { vocab: string; meanVI: string; assignedDate: Date; count: number }>();
  for (const a of assignments) {
    const existing = byVocab.get(a.vocabId);
    if (existing) {
      existing.count += 1;
      if (a.assignedDate > existing.assignedDate) existing.assignedDate = a.assignedDate;
    } else {
      byVocab.set(a.vocabId, {
        vocab: a.vocab.vocab,
        meanVI: a.vocab.meanVI,
        assignedDate: a.assignedDate,
        count: 1,
      });
    }
  }

  return [...byVocab.entries()]
    .map(([vocabId, v]) => ({
      vocabId,
      vocab: v.vocab,
      meanVI: v.meanVI,
      assignedDate: v.assignedDate.toISOString(),
      studentCount: v.count,
    }))
    .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
}

/** Removes this word's assignment for every student in the teacher's class. */
export async function cancelAssignmentAction(vocabId: string): Promise<boolean> {
  const teacher = await requireTeacher();
  if (!teacher || !teacher.classId) return false;

  const students = await prisma.account.findMany({
    where: { classId: teacher.classId, role: "student" },
    select: { id_login: true },
  });
  const studentIds = students.map((s) => s.id_login);
  if (studentIds.length === 0) return false;

  await prisma.dailyAssignment.deleteMany({ where: { accountId: { in: studentIds }, vocabId } });
  return true;
}

/** Sets the daily word target for the signed-in teacher's own class only. */
export async function updateMyClassTargetAction(dailyWordTarget: number): Promise<boolean> {
  const teacher = await requireTeacher();
  if (!teacher || !teacher.classId) return false;
  if (!Number.isInteger(dailyWordTarget) || dailyWordTarget < 1) return false;

  const updated = await prisma.schoolClass
    .update({ where: { id: teacher.classId }, data: { dailyWordTarget } })
    .catch(() => null);
  return updated !== null;
}

/**
 * Resets a student's password — scoped to students in the signed-in teacher's own class only
 * (re-verified server-side against teacher.classId, not just filtered client-side).
 */
export async function resetStudentPasswordAction(
  studentId: string,
  newPassword: string
): Promise<{ error: string } | { error?: undefined }> {
  const teacher = await requireTeacher();
  if (!teacher || !teacher.classId) return { error: "Bạn không có quyền thực hiện thao tác này." };
  if (newPassword.length < 6) return { error: "Mật khẩu cần ít nhất 6 ký tự." };

  const student = await prisma.account.findFirst({
    where: { id_login: studentId, classId: teacher.classId, role: "student" },
  });
  if (!student) return { error: "Không tìm thấy học sinh này trong lớp bạn phụ trách." };

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.account.update({ where: { id_login: studentId }, data: { passwordHash } });
  return {};
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
}

/** Full progress detail for one student — only reachable for students in the teacher's own class. */
export async function getStudentDetailAction(studentId: string): Promise<StudentDetail | null> {
  const teacher = await requireTeacher();
  if (!teacher || !teacher.classId) return null;

  const student = await prisma.account.findFirst({
    where: { id_login: studentId, classId: teacher.classId, role: "student" },
  });
  if (!student) return null;

  const [levels, accountLevels, history, totalVocab] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId: studentId } }),
    prisma.learningHistory.findMany({ where: { accountId: studentId }, include: { vocab: true } }),
    prisma.vocabulary.count(),
  ]);

  const activeLevel =
    accountLevels.find((al) => al.status === "in_progress") ??
    [...accountLevels].reverse().find((al) => al.status === "completed");
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
  };
}
