"use server";

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
