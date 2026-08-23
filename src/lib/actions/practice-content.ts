"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { PracticeTypeCode } from "@/types";

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
  correctOptionId: string;
}

/** Approved synonym_antonym Question rows — replaces the static synonymAntonymQuestions pool. */
export async function getSynonymAntonymQuestionsAction(): Promise<SynonymAntonymItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("synonym_antonym");
  if (!pracTypeIdValue) return [];

  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true, answers: true },
  });

  return rows
    .filter((q) => q.answers.length >= 2)
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      word: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      questionText: q.questionText,
      options: q.answers.map((a) => ({ id: a.id, text: a.ansText })),
      correctOptionId: q.answers.find((a) => a.isCorrect)!.id,
    }));
}

export interface FillBlankItem {
  id: string;
  vocabId: string;
  sentence: string;
  meanVI: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

/** Approved fill_blank Question rows — replaces the static fillBlankQuestions pool. */
export async function getFillBlankQuestionsAction(): Promise<FillBlankItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("fill_blank");
  if (!pracTypeIdValue) return [];

  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true, answers: true },
  });

  return rows
    .filter((q) => q.answers.length >= 2)
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      sentence: q.questionText,
      meanVI: q.vocab.meanVI,
      options: q.answers.map((a) => ({ id: a.id, text: a.ansText })),
      correctOptionId: q.answers.find((a) => a.isCorrect)!.id,
    }));
}

export interface WordFormationItem {
  id: string;
  vocabId: string;
  word: string;
  meanVI: string;
  definition: string;
}

/** Approved word_formation Question rows — replaces the static wordFormationPrompts pool. */
export async function getWordFormationPromptsAction(): Promise<WordFormationItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("word_formation");
  if (!pracTypeIdValue) return [];

  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true },
  });

  return rows.map((q) => ({
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
 * static sentencePrompts pool. */
export async function getSentenceWritingPromptsAction(): Promise<SentencePromptItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const pracTypeIdValue = await practiceTypeId("sentence_writing");
  if (!pracTypeIdValue) return [];

  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue, status: "approved" },
    include: { vocab: true },
  });

  return rows
    .filter((q): q is typeof q & { explanation: string } => Boolean(q.explanation))
    .map((q) => ({
      id: q.id,
      vocabId: q.vocabId,
      vocab: q.vocab.vocab,
      meanVI: q.vocab.meanVI,
      exampleSentence: q.explanation,
    }));
}
