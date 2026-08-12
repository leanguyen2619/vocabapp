"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { QuestionStatus, QuestionWithAnswers } from "@/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

async function multipleChoicePracTypeId(): Promise<string> {
  const pracType = await prisma.practiceType.findUnique({ where: { type: "multiple_choice" } });
  if (!pracType) throw new Error("multiple_choice PracticeType is not seeded");
  return pracType.id;
}

export async function listQuestionsAction(): Promise<QuestionWithAnswers[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const pracTypeId = await multipleChoicePracTypeId();
  const rows = await prisma.question.findMany({
    where: { pracTypeId },
    include: { answers: true, vocab: true },
    orderBy: { id: "asc" },
  });

  return rows.map((q) => ({
    id: q.id,
    vocabId: q.vocabId,
    pracTypeId: q.pracTypeId,
    questionText: q.questionText,
    explanation: q.explanation ?? undefined,
    status: q.status,
    vocab: q.vocab,
    answers: q.answers.map((a) => ({
      questionId: a.questionId,
      ansId: a.ansId,
      ansText: a.ansText,
      status: a.status,
      isCorrect: a.isCorrect,
    })),
  }));
}

export async function createQuestionAction(input: {
  vocabId: string;
  questionText: string;
  explanation?: string;
  answers: { ansText: string; isCorrect: boolean }[];
}): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const pracTypeId = await multipleChoicePracTypeId();
  await prisma.question.create({
    data: {
      vocabId: input.vocabId,
      pracTypeId,
      questionText: input.questionText,
      explanation: input.explanation,
      status: "pending",
      answers: {
        create: input.answers.map((a, i) => ({
          ansId: `a${i}`,
          ansText: a.ansText,
          isCorrect: a.isCorrect,
        })),
      },
    },
  });
  return true;
}

export async function updateQuestionAction(
  id: string,
  patch: {
    vocabId?: string;
    questionText?: string;
    explanation?: string;
    answers?: { ansText: string; isCorrect: boolean }[];
  }
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  await prisma.question.update({
    where: { id },
    data: {
      vocabId: patch.vocabId,
      questionText: patch.questionText,
      explanation: patch.explanation,
    },
  });

  if (patch.answers) {
    await prisma.answer.deleteMany({ where: { questionId: id } });
    await prisma.answer.createMany({
      data: patch.answers.map((a, i) => ({
        questionId: id,
        ansId: `a${i}`,
        ansText: a.ansText,
        isCorrect: a.isCorrect,
      })),
    });
  }

  return true;
}

export async function setQuestionStatusAction(id: string, status: QuestionStatus): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  await prisma.question.update({ where: { id }, data: { status } }).catch(() => null);
  return true;
}
