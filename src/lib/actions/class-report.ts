"use server";

import { prisma } from "@/lib/prisma";
import { buildWeakWordsReport, type WeakWordItem } from "@/lib/class-report-core";
import { getCurrentAccount } from "@/lib/session";

export type { WeakWordItem } from "@/lib/class-report-core";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function getClassWeakWordsReportAction(): Promise<WeakWordItem[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const [histories, vocabulary, studentCount] = await Promise.all([
    prisma.learningHistory.findMany({
      where: { account: { role: "student" } },
      select: { vocabId: true, status: true },
    }),
    prisma.vocabulary.findMany({ include: { level: true } }),
    prisma.account.count({ where: { role: "student" } }),
  ]);

  return buildWeakWordsReport(
    histories,
    vocabulary.map((v) => ({ id: v.id, vocab: v.vocab, meanVI: v.meanVI, levelName: v.level.level })),
    studentCount
  );
}

export async function countWeakWordsAction(): Promise<number> {
  return (await getClassWeakWordsReportAction()).length;
}
