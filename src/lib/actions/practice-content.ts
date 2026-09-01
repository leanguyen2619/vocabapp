"use server";

import { prisma } from "@/lib/prisma";
import { computeUnlockedLevelIds } from "@/lib/level-unlock";
import { recordForVocab } from "@/lib/progress-core";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import type { LearningStatus, PracticeTypeCode } from "@/types";

async function practiceTypeId(code: PracticeTypeCode): Promise<string | null> {
  const pracType = await prisma.practiceType.findUnique({ where: { type: code } });
  return pracType?.id ?? null;
}

export interface SynonymAntonymItem {
  id: string;
  vocabId: string;
  word: string;
  meanVI: string;
  definition: string;
  questionText: string;
  options: { id: string; text: string }[];
}

/** Approved synonym_antonym Question rows — replaces the static synonymAntonymQuestions pool.
 * Filtered to the caller's unlocked levels; the correct option id is graded server-side by
 * submitSynonymAntonymAnswerAction rather than shipped here. */
export async function getSynonymAntonymQuestionsAction(): Promise<SynonymAntonymItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("synonym_antonym");
  if (!pracTypeIdValue) return [];

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true, answers: true },
  });

  return rows
    .filter((q) => q.answers.length >= 2 && unlockedLevelIds.has(q.vocab.levelId))
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      word: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      definition: q.vocab.definition,
      questionText: q.questionText,
      options: q.answers.map((a) => ({ id: a.id, text: a.ansText })),
    }));
}

/** Grades a synonym/antonym answer server-side instead of trusting a client-supplied result, and
 * re-checks the question's level is actually unlocked (defense against a direct call that skips
 * the list action). */
export async function submitSynonymAntonymAnswerAction(
  questionId: string,
  selectedAnswerId: string
): Promise<{ isCorrect: boolean; correctOptionId: string; status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const [question, unlockedLevelIds] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId }, include: { vocab: true, answers: true } }),
    computeUnlockedLevelIds(account.id_login, account.role),
  ]);
  if (!question || question.status !== "approved") return { error: "Không tìm thấy câu hỏi này." };
  if (!unlockedLevelIds.has(question.vocab.levelId)) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const correctAnswer = question.answers.find((a) => a.isCorrect);
  if (!correctAnswer) return { error: "Câu hỏi này chưa có đáp án đúng." };

  const isCorrect = selectedAnswerId === correctAnswer.id;
  const status = await recordForVocab(account.id_login, question.vocabId, question.vocab.levelId, isCorrect);
  return { isCorrect, correctOptionId: correctAnswer.id, status };
}

export interface FillBlankItem {
  id: string;
  vocabId: string;
  sentence: string;
  word: string;
  meanVI: string;
  definition: string;
  options: { id: string; text: string }[];
}

/** Approved fill_blank Question rows — replaces the static fillBlankQuestions pool. Filtered to
 * the caller's unlocked levels; graded server-side by submitFillBlankAnswerAction. */
export async function getFillBlankQuestionsAction(): Promise<FillBlankItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("fill_blank");
  if (!pracTypeIdValue) return [];

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true, answers: true },
  });

  return rows
    .filter((q) => q.answers.length >= 2 && unlockedLevelIds.has(q.vocab.levelId))
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      sentence: q.questionText,
      word: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      definition: q.vocab.definition,
      options: q.answers.map((a) => ({ id: a.id, text: a.ansText })),
    }));
}

/** Grades a fill-blank answer server-side; same shape/reasoning as submitSynonymAntonymAnswerAction. */
export async function submitFillBlankAnswerAction(
  questionId: string,
  selectedAnswerId: string
): Promise<{ isCorrect: boolean; correctOptionId: string; status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const [question, unlockedLevelIds] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId }, include: { vocab: true, answers: true } }),
    computeUnlockedLevelIds(account.id_login, account.role),
  ]);
  if (!question || question.status !== "approved") return { error: "Không tìm thấy câu hỏi này." };
  if (!unlockedLevelIds.has(question.vocab.levelId)) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const correctAnswer = question.answers.find((a) => a.isCorrect);
  if (!correctAnswer) return { error: "Câu hỏi này chưa có đáp án đúng." };

  const isCorrect = selectedAnswerId === correctAnswer.id;
  const status = await recordForVocab(account.id_login, question.vocabId, question.vocab.levelId, isCorrect);
  return { isCorrect, correctOptionId: correctAnswer.id, status };
}

export interface WordFormationItem {
  id: string;
  vocabId: string;
  word: string;
  meanVI: string;
  definition: string;
}

/** Approved word_formation Question rows — replaces the static wordFormationPrompts pool.
 * Filtered to the caller's unlocked levels. */
export async function getWordFormationPromptsAction(): Promise<WordFormationItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("word_formation");
  if (!pracTypeIdValue) return [];

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true },
  });

  return rows
    .filter((q) => unlockedLevelIds.has(q.vocab.levelId))
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      word: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      definition: q.vocab.definition,
    }));
}

export interface WordTransformationItem {
  id: string;
  vocabId: string;
  /** Contains a literal "___" blank marker, e.g. "The sunset was absolutely ___." */
  sentence: string;
  /** The base/root word shown in parentheses next to the blank, e.g. "beauty". */
  rootWord: string;
  /** The correctly transformed word (== vocab.vocab) — shipped up front since this is
   * self-assessed like typing/word_formation, not server-graded: the student must produce it
   * themselves, there's no multiple-choice option list to protect. */
  answer: string;
  meanVI: string;
  definition: string;
}

/** Approved word_transformation Question rows (explanation = the given root word) — a sentence
 * with a blank plus a root word the student must grammatically transform and type, e.g.
 * "She is very ___ (care)." -> "careful". Filtered to the caller's unlocked levels. Deliberately
 * NOT part of READY_GATE_TYPES in vocabulary.ts — only ~50 words have this content so far. */
export async function getWordTransformationPromptsAction(): Promise<WordTransformationItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("word_transformation");
  if (!pracTypeIdValue) return [];

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true },
  });

  return rows
    .filter((q): q is typeof q & { explanation: string } => Boolean(q.explanation))
    .filter((q) => unlockedLevelIds.has(q.vocab.levelId))
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      sentence: q.questionText,
      rootWord: q.explanation,
      answer: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      definition: q.vocab.definition,
    }));
}

export interface ListeningComprehensionItem {
  id: string;
  vocabId: string;
  meanVI: string;
  /** Contains a literal "___" blank marker — safe to ship for every question up front since it
   * doesn't reveal which of the 4 options is correct (same reasoning as FillBlankItem.sentence). */
  sentenceTemplate: string;
  options: { id: string; text: string }[];
}

/** Approved listening_comprehension Question rows — same underlying content shape as fill_blank
 * (a natural sentence with the target word blanked out + 4 multiple-choice word options), but
 * consumed as listening comprehension: the student hears the full sentence read aloud instead of
 * reading it, then picks which word they heard. The resolved audio text (blank filled with the
 * real word) is deliberately NOT included here — it's fetched one question at a time via
 * getListeningSentenceAudioAction so the answer isn't sitting in the page's initial payload for
 * every question at once. */
export async function getListeningComprehensionQuestionsAction(): Promise<ListeningComprehensionItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("listening_comprehension");
  if (!pracTypeIdValue) return [];

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true, answers: true },
  });

  return rows
    .filter((q) => q.answers.length >= 2 && unlockedLevelIds.has(q.vocab.levelId))
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      meanVI: q.vocab.meanVI,
      sentenceTemplate: q.questionText,
      options: q.answers.map((a) => ({ id: a.id, text: a.ansText })),
    }));
}

/** Resolves one listening_comprehension question's full sentence (blank filled with the correct
 * word) for text-to-speech — see the "deliberately NOT included" note above for why this is a
 * separate, lazily-called action instead of a field on ListeningComprehensionItem. */
export async function getListeningSentenceAudioAction(
  questionId: string
): Promise<{ text: string } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const [question, unlockedLevelIds] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId }, include: { vocab: true, answers: true } }),
    computeUnlockedLevelIds(account.id_login, account.role),
  ]);
  if (!question || question.status !== "approved") return { error: "Không tìm thấy câu hỏi này." };
  if (!unlockedLevelIds.has(question.vocab.levelId)) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const correct = question.answers.find((a) => a.isCorrect);
  if (!correct) return { error: "Câu hỏi này chưa có đáp án đúng." };

  return { text: question.questionText.replace("___", correct.ansText) };
}

/** Grades a listening-comprehension answer server-side; same shape/reasoning as
 * submitFillBlankAnswerAction — the client is never trusted to self-report correctness for a
 * multiple-choice type. */
export async function submitListeningComprehensionAnswerAction(
  questionId: string,
  selectedAnswerId: string
): Promise<{ isCorrect: boolean; correctOptionId: string; status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const [question, unlockedLevelIds] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId }, include: { vocab: true, answers: true } }),
    computeUnlockedLevelIds(account.id_login, account.role),
  ]);
  if (!question || question.status !== "approved") return { error: "Không tìm thấy câu hỏi này." };
  if (!unlockedLevelIds.has(question.vocab.levelId)) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const correctAnswer = question.answers.find((a) => a.isCorrect);
  if (!correctAnswer) return { error: "Câu hỏi này chưa có đáp án đúng." };

  const isCorrect = selectedAnswerId === correctAnswer.id;
  const status = await recordForVocab(account.id_login, question.vocabId, question.vocab.levelId, isCorrect);
  return { isCorrect, correctOptionId: correctAnswer.id, status };
}

export interface SentencePromptItem {
  id: string;
  vocabId: string;
  vocab: string;
  meanVI: string;
  exampleSentence: string;
}

/** Approved sentence_writing Question rows (explanation = the example sentence) — replaces the
 * static sentencePrompts pool. Filtered to the caller's unlocked levels. */
export async function getSentenceWritingPromptsAction(): Promise<SentencePromptItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("sentence_writing");
  if (!pracTypeIdValue) return [];

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true },
  });

  return rows
    .filter((q): q is typeof q & { explanation: string } => Boolean(q.explanation))
    .filter((q) => unlockedLevelIds.has(q.vocab.levelId))
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      vocab: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      exampleSentence: q.explanation,
    }));
}

/** vocabId -> a real example sentence, reusing the sentence_writing Question bank's `explanation`
 * so the flashcard can show the word in context instead of just an isolated meaning/definition.
 * Not level-filtered — cheap to return in full since only entries matching whatever vocab list the
 * caller is already displaying ever get looked up. */
export async function getExampleSentenceMapAction(): Promise<Record<string, string>> {
  const account = await getCurrentAccount();
  if (!account) return {};

  const pracTypeIdValue = await practiceTypeId("sentence_writing");
  if (!pracTypeIdValue) return {};

  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    select: { vocabId: true, explanation: true },
  });

  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.explanation) map[row.vocabId] = row.explanation;
  }
  return map;
}

export interface ReadingBlankItem {
  id: string;
  blankNumber: number;
  word: string;
  meanVI: string;
  definition: string;
  options: { id: string; text: string }[];
}

export interface ReadingPassageData {
  id: string;
  title: string;
  /** Raw story text with literal "___1___", "___2___", ... markers — one per blank, matching
   * blanks[].blankNumber. The client splits on these to interleave real paragraph text with each
   * blank's position; the blanks themselves are answered via the separate options list below,
   * same as a printed Cambridge-style gapped passage. */
  body: string;
  blanks: ReadingBlankItem[];
}

/** The earliest approved reading passage for a level the student has unlocked — reading
 * comprehension is a single shared story with several vocabulary blanks (Cambridge-style gapped
 * passage) rather than the usual one-question-per-word shape every other practice type uses, so
 * unlike those there's no daily pool to draw from yet: just the passages an admin has approved,
 * oldest first. Returns null if none exist for an unlocked level. */
export async function getMyReadingPassageAction(): Promise<ReadingPassageData | null> {
  const account = await getCurrentAccount();
  if (!account) return null;

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  if (unlockedLevelIds.size === 0) return null;

  const passage = await prisma.readingPassage.findFirst({
    where: { status: "approved", levelId: { in: [...unlockedLevelIds] } },
    orderBy: { createdAt: "asc" },
    include: {
      questions: {
        where: { status: "approved" },
        orderBy: { blankNumber: "asc" },
        include: { answers: true, vocab: true },
      },
    },
  });
  if (!passage) return null;

  const blanks = passage.questions
    .filter((q): q is typeof q & { blankNumber: number } => q.blankNumber !== null && q.answers.length >= 2)
    .map((q) => ({
      id: q.id,
      blankNumber: q.blankNumber,
      word: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      definition: q.vocab.definition,
      options: q.answers.map((a) => ({ id: a.id, text: a.ansText })),
    }));
  if (blanks.length === 0) return null;

  return { id: passage.id, title: passage.title, body: passage.body, blanks };
}

/** Grades one reading-comprehension blank server-side; same shape/reasoning as
 * submitFillBlankAnswerAction. Also records progress against the blank's target vocabulary word,
 * same as every other practice type — a reading passage is how that word gets introduced, so
 * answering it correctly counts toward mastering it exactly like any other exercise. */
export async function submitReadingAnswerAction(
  questionId: string,
  selectedAnswerId: string
): Promise<{ isCorrect: boolean; correctOptionId: string; status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const [question, unlockedLevelIds] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId }, include: { vocab: true, answers: true } }),
    computeUnlockedLevelIds(account.id_login, account.role),
  ]);
  if (!question || question.status !== "approved") return { error: "Không tìm thấy câu hỏi này." };
  if (!unlockedLevelIds.has(question.vocab.levelId)) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const correctAnswer = question.answers.find((a) => a.isCorrect);
  if (!correctAnswer) return { error: "Câu hỏi này chưa có đáp án đúng." };

  const isCorrect = selectedAnswerId === correctAnswer.id;
  const status = await recordForVocab(account.id_login, question.vocabId, question.vocab.levelId, isCorrect);
  return { isCorrect, correctOptionId: correctAnswer.id, status };
}

export interface ReadingPracticeQuestionItem {
  id: string;
  questionText: string;
  options: { id: string; text: string }[];
}

export interface ReadingTextData {
  id: string;
  title: string;
  body: string;
  questions: ReadingPracticeQuestionItem[];
}

/** Word-overlap score between a passage's body and a student's already-learned vocabulary —
 * higher means more of the passage's words are ones the student already knows. Used only to RANK
 * candidate passages for a level, never to filter: a passage's own difficulty is controlled by
 * its levelId, same as every other content type. */
function scoreReadingTextOverlap(body: string, learnedWordsLower: Set<string>): number {
  const tokens = new Set(body.toLowerCase().match(/[a-z']+/g) ?? []);
  let score = 0;
  for (const token of tokens) {
    if (learnedWordsLower.has(token)) score++;
  }
  return score;
}

/** The reading_practice passage that best matches a student's own vocabulary, out of the pool of
 * approved passages for their unlocked levels — several passages typically exist per level, and
 * the one whose text overlaps most with words the student has already learned (LearningHistory
 * status learning/mastered) is preferred, so familiar words are more likely to show up in
 * context ("Đọc hiểu"). Ties broken randomly so a whole cohort doesn't always land on the same
 * passage. Unlike reading_comprehension, there's no fixed "oldest first" order — the point of
 * this type is per-student selection. Returns null if no approved passage (with at least 1
 * approved comprehension question) exists for an unlocked level. */
export async function getMyReadingTextAction(): Promise<ReadingTextData | null> {
  const account = await getCurrentAccount();
  if (!account) return null;

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login, account.role);
  if (unlockedLevelIds.size === 0) return null;

  const [passages, learnedRows] = await Promise.all([
    prisma.readingText.findMany({
      where: { status: "approved", levelId: { in: [...unlockedLevelIds] } },
      include: { questions: { where: { status: "approved" }, include: { answers: true } } },
    }),
    prisma.learningHistory.findMany({
      where: { accountId: account.id_login, status: { in: ["learning", "mastered"] } },
      include: { vocab: { select: { vocab: true } } },
    }),
  ]);

  const candidates = passages.filter((p) => p.questions.some((q) => q.answers.length >= 2));
  if (candidates.length === 0) return null;

  const learnedWordsLower = new Set(learnedRows.map((r) => r.vocab.vocab.toLowerCase()));
  const best = shuffle(candidates)
    .map((p) => ({ passage: p, score: scoreReadingTextOverlap(p.body, learnedWordsLower) }))
    .sort((a, b) => b.score - a.score)[0].passage;

  return {
    id: best.id,
    title: best.title,
    body: best.body,
    questions: best.questions
      .filter((q) => q.answers.length >= 2)
      .map((q) => ({ id: q.id, questionText: q.questionText, options: q.answers.map((a) => ({ id: a.id, text: a.ansText })) })),
  };
}

/** Grades one reading_practice comprehension-check answer server-side; same shape/reasoning as
 * submitReadingAnswerAction. Progress is recorded against the question's linked vocabulary word
 * (the word the question centers on), same convention as every other type. */
export async function submitReadingTextAnswerAction(
  questionId: string,
  selectedAnswerId: string
): Promise<{ isCorrect: boolean; correctOptionId: string; status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const [question, unlockedLevelIds] = await Promise.all([
    prisma.question.findUnique({ where: { id: questionId }, include: { vocab: true, answers: true } }),
    computeUnlockedLevelIds(account.id_login, account.role),
  ]);
  if (!question || question.status !== "approved") return { error: "Không tìm thấy câu hỏi này." };
  if (!unlockedLevelIds.has(question.vocab.levelId)) {
    return { error: "Từ vựng này chưa được mở khóa." };
  }

  const correctAnswer = question.answers.find((a) => a.isCorrect);
  if (!correctAnswer) return { error: "Câu hỏi này chưa có đáp án đúng." };

  const isCorrect = selectedAnswerId === correctAnswer.id;
  const status = await recordForVocab(account.id_login, question.vocabId, question.vocab.levelId, isCorrect);
  return { isCorrect, correctOptionId: correctAnswer.id, status };
}
