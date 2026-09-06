"use server";

import { prisma } from "@/lib/prisma";
import { buildWeakWordsReport, computeMinAttempted, type WeakWordItem } from "@/lib/class-report-core";
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

/** Just the dashboard badge's count — re-running the full report (fetches every LearningHistory
 * row for every student, joins the whole Vocabulary+Level table, sorts, slices) on every single
 * admin dashboard load just to read `.length` off the end was the actual cost here, not something
 * a cache would be the right fix for (the count needs to reflect the class's current state each
 * time, not a stale snapshot). Aggregates in Postgres via groupBy instead of pulling every row into
 * JS, and skips the Vocabulary/Level join entirely — this only needs counts, never the words'
 * display text. Capped at 20 to match getClassWeakWordsReportAction's own `.slice(0, 20)`, so the
 * badge and the full report page it links to always agree. */
export async function countWeakWordsAction(): Promise<number> {
  const admin = await requireAdmin();
  if (!admin) return 0;

  const studentCount = await prisma.account.count({ where: { role: "student" } });
  const minAttempted = computeMinAttempted(studentCount);

  const grouped = await prisma.learningHistory.groupBy({
    by: ["vocabId"],
    where: { account: { role: "student" } },
    _count: { _all: true },
  });
  const qualifying = grouped.filter((g) => g._count._all >= minAttempted).length;
  return Math.min(20, qualifying);
}
