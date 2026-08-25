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
  meanVI: string;
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
      meanVI: q.vocab.meanVI,
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
