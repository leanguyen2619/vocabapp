"use server";

import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { getLocale } from "@/lib/i18n/locale";
import { computeUnlockedLevelIds } from "@/lib/level-unlock";
import { recordForVocab } from "@/lib/progress-core";
import { getCurrentAccount, type SessionAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import type { WordScope } from "@/lib/word-scope";
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

const OLD_WORDS_SESSION_SIZE = 20;

/** "new" = today's pinned words not yet attempted; "mixed" = today's full pinned set (the
 * existing daily-word behavior); "old" = previously-studied words (learning or already mastered)
 * drawn from the student's whole history, not just today, oldest-touched first — a lightweight
 * review pool. Used by the 5 word-driven games (Quiz, Flashcard, Matching, Typing, Listening) via
 * the category picker on /exercises. */
async function oldWordsForAccount(account: SessionAccount): Promise<Vocabulary[]> {
  const history = await prisma.learningHistory.findMany({
    where: { accountId: account.id_login, status: { in: ["learning", "mastered"] } },
    orderBy: { lastDate: "asc" },
    take: OLD_WORDS_SESSION_SIZE,
    include: { vocab: true },
  });
  return history.map((h) => h.vocab);
}

export async function getMyWordsForScopeAction(scope: WordScope): Promise<Vocabulary[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  if (scope === "old") return oldWordsForAccount(account);

  const words = await computeDailyWords(account);
  if (scope === "new") return words.filter((w) => w.status === "new").map((w) => w.vocab);
  return words.map((w) => w.vocab);
}

/**
 * Chooses today's word set the first time it's requested each day, prioritizing the student's
 * teacher-assigned words (not yet mastered, regardless of level — a teacher can deliberately
 * assign ahead of the student's unlocked level), topped up from levels the student has actually
 * unlocked. This selection runs only once per calendar day (persisted as DailyWordPick rows) —
 * every later call the same day reads back that exact set instead of recomputing it, so mastering
 * a word mid-session can't cause it to be silently swapped for a different one and the "today's
 * words" list stays the same set the student started with.
 */
async function pickTodaysWordIds(account: SessionAccount, today: Date): Promise<string[]> {
  const [cls, vocabulary, history, assignments, unlockedLevelIds] = await Promise.all([
    account.classId ? prisma.schoolClass.findUnique({ where: { id: account.classId } }) : null,
    prisma.vocabulary.findMany({ orderBy: { id: "asc" } }),
    prisma.learningHistory.findMany({ where: { accountId: account.id_login } }),
    prisma.dailyAssignment.findMany({
      where: { accountId: account.id_login },
      select: { vocabId: true },
      distinct: ["vocabId"],
    }),
    computeUnlockedLevelIds(account.id_login),
  ]);

  const target = cls?.dailyWordTarget ?? 5;
  const priority: Record<LearningStatus, number> = { new: 0, learning: 1, mastered: 2 };
  const statusOf = (vocabId: string): LearningStatus =>
    history.find((h) => h.vocabId === vocabId)?.status ?? "new";

  const assignedIds = new Set(assignments.map((a) => a.vocabId));
  const withStatus = vocabulary.map((vocab) => ({ vocab, status: statusOf(vocab.id) }));

  const assignedWords = withStatus
    .filter((w) => assignedIds.has(w.vocab.id) && w.status !== "mastered")
    .sort((a, b) => priority[a.status] - priority[b.status]);

  let picked: { vocab: Vocabulary; status: LearningStatus }[];
  if (assignedWords.length >= target) {
    picked = assignedWords.slice(0, Math.max(1, target));
  } else {
    const remaining = withStatus
      .filter(
        (w) =>
          (!assignedIds.has(w.vocab.id) || w.status === "mastered") &&
          unlockedLevelIds.has(w.vocab.levelId)
      )
      .sort((a, b) => priority[a.status] - priority[b.status]);
    picked = [...assignedWords, ...remaining].slice(0, Math.max(1, target));
  }

  const pickedVocabIds = picked.map((p) => p.vocab.id);
  if (pickedVocabIds.length > 0) {
    await prisma.dailyWordPick.createMany({
      data: pickedVocabIds.map((vocabId) => ({ accountId: account.id_login, vocabId, pickedDate: today })),
      skipDuplicates: true,
    });
  }
  return pickedVocabIds;
}

async function computeDailyWords(
  account: SessionAccount
): Promise<{ vocab: Vocabulary; status: LearningStatus }[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingPicks = await prisma.dailyWordPick.findMany({
    where: { accountId: account.id_login, pickedDate: today },
    orderBy: { id: "asc" },
    select: { vocabId: true },
  });

  const pickedVocabIds =
    existingPicks.length > 0
      ? existingPicks.map((p) => p.vocabId)
      : await pickTodaysWordIds(account, today);

  if (pickedVocabIds.length === 0) return [];

  // The word SET is pinned above, but each word's status is still read live — a word correctly
  // answered during today's session should still visibly flip to "learning"/"mastered".
  const [vocabRows, history] = await Promise.all([
    prisma.vocabulary.findMany({ where: { id: { in: pickedVocabIds } } }),
    prisma.learningHistory.findMany({
      where: { accountId: account.id_login, vocabId: { in: pickedVocabIds } },
    }),
  ]);
  const vocabById = new Map(vocabRows.map((v) => [v.id, v]));
  const statusOf = (vocabId: string): LearningStatus =>
    history.find((h) => h.vocabId === vocabId)?.status ?? "new";

  return pickedVocabIds
    .map((id) => vocabById.get(id))
    .filter((v): v is Vocabulary => Boolean(v))
    .map((vocab) => ({ vocab, status: statusOf(vocab.id) }));
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
 *
 * The correct option id is intentionally NOT included here — see submitQuizAnswerAction, which
 * grades server-side instead of trusting the client to self-report whether it picked right.
 *
 * `scope` picks which word pool the quiz draws from (see getMyWordsForScopeAction) — defaults to
 * today's usual new+old mix so existing callers are unaffected.
 */
export async function getMyQuizQuestionsAction(scope: WordScope = "mixed"): Promise<QuizQuestionItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];
  const dict = getDictionary(await getLocale());

  const dailyWords = await getMyWordsForScopeAction(scope);
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
      vocabWord: vocab.vocab,
      definition: vocab.definition,
    };
  });
}

/**
 * Grades a quiz answer server-side and records the result. Re-derives the correct answer the same
 * way getMyQuizQuestionsAction built it (a real approved Question's Answer, or — for a word
 * without one — the vocab's own id) instead of trusting a client-supplied "isCorrect".
 *
 * Also re-checks that vocabId is something the student may currently practice (an unlocked level,
 * or explicitly teacher-assigned) so a direct call with a locked-level vocabId — bypassing the
 * daily-word list entirely — can't be used to fast-track that level's completion.
 */
export async function submitQuizAnswerAction(
  vocabId: string,
  selectedOptionId: string
): Promise<{ isCorrect: boolean; correctOptionId: string; status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  // None of these four depend on each other's result, so they go in one round trip instead of
  // three sequential ones — this action is on the hot path (fires on every answer).
  const [vocab, unlockedLevelIds, assignment, pracType] = await Promise.all([
    prisma.vocabulary.findUnique({ where: { id: vocabId } }),
    computeUnlockedLevelIds(account.id_login),
    prisma.dailyAssignment.findFirst({ where: { accountId: account.id_login, vocabId } }),
    prisma.practiceType.findUnique({ where: { type: "multiple_choice" } }),
  ]);
  if (!vocab) return { error: "Không tìm thấy từ vựng này." };
  if (!unlockedLevelIds.has(vocab.levelId) && !assignment) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const real = pracType
    ? await prisma.question.findFirst({
        where: { vocabId, pracTypeId: pracType.id, status: "approved" },
        include: { answers: true },
      })
    : null;

  const correctOptionId =
    real && real.answers.length >= 2 ? real.answers.find((a) => a.isCorrect)!.id : vocab.id;
  const isCorrect = selectedOptionId === correctOptionId;

  const status = await recordForVocab(account.id_login, vocabId, vocab.levelId, isCorrect);
  return { isCorrect, correctOptionId, status };
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

  // Deliberately not caught: a genuine DB error here must propagate as a rejected promise so
  // the client's try/catch shows "import failed" instead of the misleading "file is empty"
  // message it would otherwise show for a 0-count result.
  const result = await prisma.vocabulary.createMany({ data: rows });
  return result.count;
}
