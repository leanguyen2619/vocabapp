"use server";

import { prisma } from "@/lib/prisma";
import { computeUnlockedLevelIds } from "@/lib/level-unlock";
import { recordForVocab } from "@/lib/progress-core";
import { getCurrentAccount } from "@/lib/session";
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

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login);
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
    computeUnlockedLevelIds(account.id_login),
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

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login);
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
    computeUnlockedLevelIds(account.id_login),
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

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login);
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

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login);
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
    computeUnlockedLevelIds(account.id_login),
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
    computeUnlockedLevelIds(account.id_login),
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

  const unlockedLevelIds = await computeUnlockedLevelIds(account.id_login);
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
