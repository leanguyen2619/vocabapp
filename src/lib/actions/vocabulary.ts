"use server";

import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount, type SessionAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
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

export interface QuizQuestionItem {
  vocabId: string;
  topicId: number;
  questionText: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  vocabWord: string;
  definition: string;
  explanation?: string;
}

/**
 * Builds today's quiz from the student's daily words, preferring a real, admin-approved question
 * from the Question Bank when one exists for that word — previously the quiz always synthesized
 * its own question client-side, so nothing an admin curated there ever reached students. Falls
 * back to the old auto-generated "which word means {mean}?" format (options = the rest of today's
 * words) for any word without an approved question yet.
 */
export async function getMyQuizQuestionsAction(): Promise<QuizQuestionItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  const dict = getDictionary(await getLocale());

  const dailyWords = await getMyDailyWordsAction();
  if (dailyWords.length === 0) return [];

  const pracType = await prisma.practiceType.findUnique({ where: { type: "multiple_choice" } });
  const vocabIds = dailyWords.map((v) => v.id);
  const realQuestions = pracType
    ? await prisma.question.findMany({
        where: { vocabId: { in: vocabIds }, pracTypeId: pracType.id, status: "approved" },
        include: { answers: true },
      })
    : [];

  const realByVocabId = new Map<string, (typeof realQuestions)[number]>();
  for (const q of realQuestions) {
    if (!realByVocabId.has(q.vocabId) && q.answers.length >= 2) realByVocabId.set(q.vocabId, q);
  }

  return shuffle(dailyWords).map((vocab): QuizQuestionItem => {
    const real = realByVocabId.get(vocab.id);
    if (real) {
      return {
        vocabId: vocab.id,
        topicId: vocab.topicId,
        questionText: real.questionText,
        options: shuffle(real.answers.map((a) => ({ id: a.id, text: a.ansText }))),
        correctOptionId: real.answers.find((a) => a.isCorrect)!.id,
        vocabWord: vocab.vocab,
        definition: vocab.definition,
        explanation: real.explanation ?? undefined,
      };
    }
    return {
      vocabId: vocab.id,
      topicId: vocab.topicId,
      questionText: formatMessage(dict.quizSession.questionPrompt, { mean: vocab.meanVI }),
      options: shuffle(dailyWords.map((v) => ({ id: v.id, text: v.vocab }))),
      correctOptionId: vocab.id,
      vocabWord: vocab.vocab,
      definition: vocab.definition,
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

  if (!input.vocab.trim() || !input.definition.trim() || !input.meanVI.trim()) {
    return { error: "Vui lòng điền đầy đủ thông tin." };
  }

  const created = await prisma.vocabulary.create({ data: input }).catch(() => null);
  if (!created) return { error: "Chủ đề hoặc cấp độ đã chọn không hợp lệ." };
  return { id: created.id };
}

export async function updateVocabularyAction(id: string, input: VocabInput): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const updated = await prisma.vocabulary.update({ where: { id }, data: input }).catch(() => null);
  return updated !== null;
}

export async function deleteVocabularyAction(
  id: string
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const deleted = await prisma.vocabulary.delete({ where: { id } }).catch(() => null);
  if (!deleted) {
    return {
      error: "Không thể xóa từ này vì đang được dùng trong câu hỏi, bài tập hoặc bài giao.",
    };
  }
  return {};
}

export async function bulkCreateVocabularyAction(rows: VocabInput[]): Promise<number> {
  const admin = await requireAdmin();
  if (!admin) return 0;
  if (rows.length === 0) return 0;

  const result = await prisma.vocabulary.createMany({ data: rows }).catch(() => ({ count: 0 }));
  return result.count;
}
