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

/** Creates any of the given topic names that don't already exist (matched case-insensitively) and
 * returns the full, current topic list — used by the Excel import flow so a file naming topics the
 * app doesn't have yet (e.g. a new CEFR level's Cambridge-style categories) doesn't require an
 * admin to hand-create them first just to get past the importer's topic-matching step. */
export async function ensureTopicsAction(names: string[]): Promise<Topic[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const wanted = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (wanted.length === 0) return prisma.topic.findMany({ orderBy: { id: "asc" } });

  const existing = await prisma.topic.findMany();
  const existingLower = new Set(existing.map((t) => t.topic.toLowerCase()));
  const toCreate = wanted.filter((name) => !existingLower.has(name.toLowerCase()));

  if (toCreate.length > 0) {
    await prisma.topic.createMany({ data: toCreate.map((topic) => ({ topic, definition: topic })) });
  }
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
/** Question-bank practice types a word must have real content for before it's handed out as a
 * new daily word (auto-picked, not explicitly assigned — see READY_GATE_TYPES below).
 * "multiple_choice" is deliberately excluded: it's a pre-existing, separately-tracked content gap
 * (2/34 words covered, unrelated to any recent import) — gating on it too would make almost every
 * word in the app "not ready" and break daily assignment entirely, which isn't what this exists to
 * prevent. */
const READY_GATE_TYPES = [
  "sentence_writing",
  "synonym_antonym",
  "fill_blank",
  "word_formation",
  "listening_comprehension",
] as const;

/** Words with real exercise content for every type in READY_GATE_TYPES — the auto-pick "remaining"
 * pool below only introduces NEW words from this set, so a student is never hand a word that then
 * dead-ends into "no questions" on most exercise types. An explicit admin assignment bypasses this
 * (see pickTodaysWordIds) since that's a deliberate override, not an auto-pick. */
async function computeReadyVocabIds(): Promise<Set<string>> {
  const gateTypes = await prisma.practiceType.findMany({
    where: { type: { in: [...READY_GATE_TYPES] } },
    select: { id: true },
  });
  if (gateTypes.length === 0) return new Set();
  const gateTypeIds = gateTypes.map((t) => t.id);

  const coverage = await prisma.question.findMany({
    where: { pracTypeId: { in: gateTypeIds }, status: "approved" },
    select: { vocabId: true, pracTypeId: true },
    distinct: ["vocabId", "pracTypeId"],
  });

  const typeIdsByVocab = new Map<string, Set<string>>();
  for (const row of coverage) {
    const set = typeIdsByVocab.get(row.vocabId) ?? new Set<string>();
    set.add(row.pracTypeId);
    typeIdsByVocab.set(row.vocabId, set);
  }

  const ready = new Set<string>();
  for (const [vocabId, typeIds] of typeIdsByVocab) {
    if (typeIds.size >= gateTypeIds.length) ready.add(vocabId);
  }
  return ready;
}

/**
 * Picks the auto-assigned "remaining" pool in curriculum order: earliest unlocked level first,
 * then earliest topic within that level (Topic.id order — for A2 this matches the Cambridge
 * source file's category order), introducing every word in a topic before moving to the next one
 * — a student works through one theme at a time rather than a random grab-bag across 25+ topics.
 * Only draws NEW words from the ready set (see computeReadyVocabIds). A topic contributes its own
 * ready, not-yet-mastered words (new first, then learning) while it still has anything new to
 * introduce; once a topic's new supply is exhausted it's skipped entirely (its learning words fall
 * to the tier-2 review pool in the caller, not here) — but picking still spills into the next
 * topic/level to fill the daily target rather than stopping at whatever a single small topic has,
 * so "Family" having only 1 A1 word doesn't leave a student with a 1-word day.
 */
function pickSequentialRemaining(
  levelOrder: string[],
  vocabulary: Vocabulary[],
  readyIds: Set<string>,
  statusOf: (vocabId: string) => LearningStatus,
  priority: Record<LearningStatus, number>,
  target: number
): { vocab: Vocabulary; status: LearningStatus }[] {
  const collected: { vocab: Vocabulary; status: LearningStatus }[] = [];

  for (const levelId of levelOrder) {
    if (collected.length >= target) break;
    const levelVocab = vocabulary.filter((v) => v.levelId === levelId);
    const topicIds = [...new Set(levelVocab.map((v) => v.topicId))].sort((a, b) => a - b);

    for (const topicId of topicIds) {
      if (collected.length >= target) break;
      const readyTopicVocab = levelVocab.filter((v) => v.topicId === topicId && readyIds.has(v.id));
      const hasNew = readyTopicVocab.some((v) => statusOf(v.id) === "new");
      if (!hasNew) continue; // this topic's ready words are already all introduced — move on

      const sorted = readyTopicVocab
        .filter((v) => statusOf(v.id) !== "mastered")
        .map((vocab) => ({ vocab, status: statusOf(vocab.id) }))
        .sort((a, b) => priority[a.status] - priority[b.status]);
      for (const item of sorted) {
        if (collected.length >= target) break;
        collected.push(item);
      }
    }
  }
  return collected;
}

async function pickTodaysWordIds(account: SessionAccount, today: Date): Promise<string[]> {
  const [cls, vocabulary, history, assignments, unlockedLevelIds, readyIds, levels] = await Promise.all([
    account.classId ? prisma.schoolClass.findUnique({ where: { id: account.classId } }) : null,
    prisma.vocabulary.findMany({ orderBy: { id: "asc" } }),
    prisma.learningHistory.findMany({ where: { accountId: account.id_login } }),
    prisma.dailyAssignment.findMany({
      where: { accountId: account.id_login },
      select: { vocabId: true },
      distinct: ["vocabId"],
    }),
    computeUnlockedLevelIds(account.id_login),
    computeReadyVocabIds(),
    prisma.level.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
  ]);

  const target = account.dailyWordTargetOverride ?? cls?.dailyWordTarget ?? 5;
  const priority: Record<LearningStatus, number> = { new: 0, learning: 1, mastered: 2 };
  const statusOf = (vocabId: string): LearningStatus =>
    history.find((h) => h.vocabId === vocabId)?.status ?? "new";

  const assignedIds = new Set(assignments.map((a) => a.vocabId));
  const withStatus = vocabulary.map((vocab) => ({ vocab, status: statusOf(vocab.id) }));

  // Explicit admin assignments are a deliberate override — never gated by content readiness.
  const assignedWords = withStatus
    .filter((w) => assignedIds.has(w.vocab.id) && w.status !== "mastered")
    .sort((a, b) => priority[a.status] - priority[b.status]);

  let picked: { vocab: Vocabulary; status: LearningStatus }[];
  if (assignedWords.length >= target) {
    picked = assignedWords.slice(0, Math.max(1, target));
  } else {
    const unassignedVocabAll = vocabulary.filter(
      (v) => (!assignedIds.has(v.id) || statusOf(v.id) === "mastered") && unlockedLevelIds.has(v.levelId)
    );
    // A pinned topic (admin-set, per student — see Account.pinnedTopicId) restricts auto-pick to
    // just that topic, day after day, until the admin changes or clears it. Falls back to the
    // normal cross-topic pool if the pin has nothing usable in this student's unlocked levels
    // (e.g. the topic has no content there yet) so a pin can never leave a student with 0 words.
    const pinnedTopicVocab =
      account.pinnedTopicId !== null
        ? unassignedVocabAll.filter((v) => v.topicId === account.pinnedTopicId)
        : [];
    const unassignedVocab = pinnedTopicVocab.length > 0 ? pinnedTopicVocab : unassignedVocabAll;
    const levelOrder = levels.map((l) => l.id).filter((id) => unlockedLevelIds.has(id));

    // Reserve up to 1 of today's slots for a previously-mastered word to resurface as review —
    // mixed in alongside new/learning words rather than added on top, so the daily total never
    // grows past `target`. Skipped entirely once there's nothing left to reserve room for (an
    // explicit assignment already ate the whole quota) or the student has no mastered words yet.
    const totalQuota = Math.max(1, target) - assignedWords.length;
    const masteredPool = unassignedVocab.filter((v) => statusOf(v.id) === "mastered");
    const reviewQuota = totalQuota > 0 && masteredPool.length > 0 ? Math.min(1, totalQuota) : 0;
    const newQuota = totalQuota - reviewQuota;

    // Tier 1: curriculum-ordered, content-ready words (the normal path).
    let remaining = pickSequentialRemaining(levelOrder, unassignedVocab, readyIds, statusOf, priority, newQuota);
    // Tier 2: every ready word has already been introduced somewhere — fall back to any ready,
    // not-yet-mastered word so review still flows once a level/topic's new content runs out.
    if (remaining.length === 0) {
      remaining = unassignedVocab
        .filter((v) => readyIds.has(v.id) && statusOf(v.id) !== "mastered")
        .map((vocab) => ({ vocab, status: statusOf(vocab.id) }))
        .sort((a, b) => priority[a.status] - priority[b.status]);
    }
    // Tier 3: nothing ready at all (e.g. a freshly unlocked level with no authored content yet) —
    // fall back to the old any-unlocked-word behavior so a student is never left with zero words.
    if (remaining.length === 0) {
      remaining = unassignedVocab
        .map((vocab) => ({ vocab, status: statusOf(vocab.id) }))
        .sort((a, b) => priority[a.status] - priority[b.status]);
    }

    const reviewWords = shuffle(masteredPool)
      .slice(0, reviewQuota)
      .map((vocab) => ({ vocab, status: "mastered" as LearningStatus }));

    picked = [...assignedWords, ...remaining.slice(0, newQuota), ...reviewWords].slice(0, Math.max(1, target));
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

  // Fast path: today's picks already exist (the overwhelmingly common case — this function is
  // called from several places on the same page, e.g. dashboard's Promise.all calls both
  // getMyDailyAssignmentsAction and getMyWordsForScopeAction("new"), and each independently
  // reaches this function).
  let pickedVocabIds: string[];
  if (existingPicks.length > 0) {
    pickedVocabIds = existingPicks.map((p) => p.vocabId);
  } else {
    // Slow path — nothing picked yet today. Two of those concurrent callers can both see an
    // empty DailyWordPick table and both proceed to compute+insert their own pick before either
    // one's write is visible to the other; skipDuplicates only dedupes identical vocabIds, so two
    // DIFFERENT random picks (pickTodaysWordIds now includes a random mastered-word review slot —
    // see its own comment) would both survive, inflating the day's word count past `target`. A
    // Postgres advisory lock scoped to (accountId, date) serializes the decision: whichever call
    // gets there first computes and writes; every other concurrent call blocks, then re-checks
    // and finds that first call's already-committed picks instead of computing its own.
    const lockKey = `daily-word-pick:${account.id_login}:${today.toISOString()}`;
    pickedVocabIds = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const recheck = await tx.dailyWordPick.findMany({
        where: { accountId: account.id_login, pickedDate: today },
        orderBy: { id: "asc" },
        select: { vocabId: true },
      });
      if (recheck.length > 0) return recheck.map((p) => p.vocabId);
      return pickTodaysWordIds(account, today);
    });
  }

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

  // The synthetic ("which word means X?") fallback uses the scoped word pool itself as decoy
  // options — fine most of the time, but a scope like "new" can leave only 1-2 words some days,
  // which would produce a multiple-choice question with just 1 option (impossible to answer
  // wrong). Pad the decoy pool from the wider vocabulary bank in that case; a decoy never needs
  // an eligibility check since picking one just grades the attempt wrong.
  const MIN_OPTIONS = 4;
  const needsSynthetic = dailyWords.some((v) => !realByVocabId.has(v.id));
  let decoyPool = dailyWords;
  if (needsSynthetic && dailyWords.length < MIN_OPTIONS) {
    const extra = await prisma.vocabulary.findMany({
      where: { id: { notIn: dailyWords.map((v) => v.id) } },
      take: MIN_OPTIONS * 2,
    });
    decoyPool = [...dailyWords, ...extra];
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
    const decoys = shuffle(decoyPool.filter((v) => v.id !== vocab.id)).slice(0, MIN_OPTIONS - 1);
    return {
      vocabId: vocab.id,
      topicId: vocab.topicId,
      questionText: formatMessage(dict.quizSession.questionPrompt, { mean: vocab.meanVI }),
      options: shuffle([{ id: vocab.id, text: vocab.vocab }, ...decoys.map((v) => ({ id: v.id, text: v.vocab }))]),
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

const POS_QUESTION_COUNT = 8;

export interface PosClassificationItem {
  vocabId: string;
  topicId: number;
  vocab: string;
  definition: string;
}

/**
 * Picks today's part-of-speech round from the student's unlocked levels only — unlike the raw
 * vocabulary bank this used to read from, which had no level check at all. The correct
 * partOfSpeech is intentionally NOT included here; see submitPosAnswerAction, which grades
 * server-side instead of shipping the answer to the client (the 4 options — noun/verb/adjective/
 * adverb — are a fixed, public list the UI already knows, so nothing about *this* word's data
 * needs to leave the server before the student answers).
 */
export async function getPosClassificationItemsAction(): Promise<PosClassificationItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login);
  const rows = await prisma.vocabulary.findMany({
    where: { levelId: { in: [...unlockedLevelIds] } },
  });

  return shuffle(rows)
    .slice(0, POS_QUESTION_COUNT)
    .map((v) => ({ vocabId: v.id, topicId: v.topicId, vocab: v.vocab, definition: v.definition }));
}

/** Grades a part-of-speech answer server-side and re-checks the word's level is unlocked. */
export async function submitPosAnswerAction(
  vocabId: string,
  selectedPos: PartOfSpeech
): Promise<{ isCorrect: boolean; correctPos: PartOfSpeech; status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const [vocab, unlockedLevelIds] = await Promise.all([
    prisma.vocabulary.findUnique({ where: { id: vocabId } }),
    computeUnlockedLevelIds(account.id_login),
  ]);
  if (!vocab) return { error: "Không tìm thấy từ vựng này." };
  if (!unlockedLevelIds.has(vocab.levelId)) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const isCorrect = selectedPos === vocab.partOfSpeech;
  const status = await recordForVocab(account.id_login, vocab.id, vocab.levelId, isCorrect);
  return { isCorrect, correctPos: vocab.partOfSpeech, status };
}

type VocabInput = {
  vocab: string;
  definition: string;
  meanVI: string;
  partOfSpeech: PartOfSpeech;
  ipa?: string | null;
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
