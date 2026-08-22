"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount, type SessionAccount } from "@/lib/session";
import type {
  AssignmentStatus,
  DailyAssignmentWithVocab,
  LearningStatus,
  PartOfSpeech,
  Topic,
  Vocabulary,
  VocabularyWithProgress,
} from "@/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function listTopicsAction(): Promise<Topic[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  return prisma.topic.findMany({ orderBy: { id: "asc" } });
}

/** Any signed-in user may read the full bank (e.g. the POS-classification game samples from it). */
export async function listVocabularyAction(): Promise<Vocabulary[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  return prisma.vocabulary.findMany({ orderBy: { id: "asc" } });
}

export async function getMyVocabularyWithProgressAction(): Promise<VocabularyWithProgress[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const [vocabulary, history] = await Promise.all([
    prisma.vocabulary.findMany({ orderBy: { id: "asc" } }),
    prisma.learningHistory.findMany({ where: { accountId: account.id_login } }),
  ]);

  return vocabulary.map((v) => ({
    ...v,
    learningStatus: history.find((h) => h.vocabId === v.id)?.status ?? "new",
  }));
}

/**
 * Words the student's teacher explicitly assigned (not yet mastered) come first, regardless of
 * level — a teacher can deliberately assign ahead of the student's unlocked level. If that
 * doesn't fill the class's daily target, the rest is topped up from the bank same as before, but
 * only from levels the student has actually unlocked, so auto-fill can't silently "complete" a
 * level the student hasn't reached yet.
 */
async function computeDailyWords(
  account: SessionAccount
): Promise<{ vocab: Vocabulary; status: LearningStatus }[]> {
  const [cls, vocabulary, history, assignments, levels, accountLevels] = await Promise.all([
    account.classId ? prisma.schoolClass.findUnique({ where: { id: account.classId } }) : null,
    prisma.vocabulary.findMany({ orderBy: { id: "asc" } }),
    prisma.learningHistory.findMany({ where: { accountId: account.id_login } }),
    prisma.dailyAssignment.findMany({
      where: { accountId: account.id_login },
      select: { vocabId: true },
      distinct: ["vocabId"],
    }),
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId: account.id_login } }),
  ]);

  // Same sequential-unlock rule as getMyStudentLevelIndexAction: level 1 is open by default,
  // each further level opens once the previous one is in_progress/completed.
  let unlockedIndex = 1;
  levels.forEach((level, index) => {
    const status = accountLevels.find((al) => al.levelId === level.id)?.status ?? "locked";
    if (status === "completed" || status === "in_progress") unlockedIndex = index + 1;
  });
  const unlockedLevelIds = new Set(levels.slice(0, unlockedIndex).map((l) => l.id));

  const target = cls?.dailyWordTarget ?? 5;
  const priority: Record<LearningStatus, number> = { new: 0, learning: 1, mastered: 2 };
  const statusOf = (vocabId: string): LearningStatus =>
    history.find((h) => h.vocabId === vocabId)?.status ?? "new";

  const assignedIds = new Set(assignments.map((a) => a.vocabId));
  const withStatus = vocabulary.map((vocab) => ({ vocab, status: statusOf(vocab.id) }));

  const assignedWords = withStatus
    .filter((w) => assignedIds.has(w.vocab.id) && w.status !== "mastered")
    .sort((a, b) => priority[a.status] - priority[b.status]);

  if (assignedWords.length >= target) {
    return assignedWords.slice(0, Math.max(1, target));
  }

  const remaining = withStatus
    .filter(
      (w) =>
        (!assignedIds.has(w.vocab.id) || w.status === "mastered") &&
        unlockedLevelIds.has(w.vocab.levelId)
    )
    .sort((a, b) => priority[a.status] - priority[b.status]);

  return [...assignedWords, ...remaining].slice(0, Math.max(1, target));
}

export async function getMyDailyWordsAction(): Promise<Vocabulary[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  const words = await computeDailyWords(account);
  return words.map((w) => w.vocab);
}

export async function getMyDailyAssignmentsAction(): Promise<DailyAssignmentWithVocab[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const today = new Date().toISOString().slice(0, 10);
  const words = await computeDailyWords(account);

  return words.map(({ vocab, status }) => {
    const assignmentStatus: AssignmentStatus =
      status === "mastered" ? "done" : status === "learning" ? "in_progress" : "pending";
    return {
      assignmentId: `assign_${account.id_login}_${vocab.id}`,
      accountId: account.id_login,
      vocabId: vocab.id,
      assignedDate: today,
      status: assignmentStatus,
      vocab,
    };
  });
}

type VocabInput = {
  vocab: string;
  definition: string;
  meanVI: string;
  partOfSpeech: PartOfSpeech;
  topicId: number;
  levelId: string;
};

export async function createVocabularyAction(
  input: VocabInput
): Promise<{ error: string } | { error?: undefined; id: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const created = await prisma.vocabulary.create({ data: input });
  return { id: created.id };
}

export async function updateVocabularyAction(id: string, input: VocabInput): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const updated = await prisma.vocabulary.update({ where: { id }, data: input }).catch(() => null);
  return updated !== null;
}

export async function deleteVocabularyAction(id: string): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  await prisma.vocabulary.delete({ where: { id } }).catch(() => null);
  return true;
}

export async function bulkCreateVocabularyAction(rows: VocabInput[]): Promise<number> {
  const admin = await requireAdmin();
  if (!admin) return 0;
  if (rows.length === 0) return 0;

  const result = await prisma.vocabulary.createMany({ data: rows });
  return result.count;
}
