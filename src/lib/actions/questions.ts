"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { PracticeTypeCode, QuestionStatus, QuestionWithAnswers } from "@/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

async function practiceTypeId(code: PracticeTypeCode): Promise<string> {
  const pracType = await prisma.practiceType.findUnique({ where: { type: code } });
  if (!pracType) throw new Error(`${code} PracticeType is not seeded`);
  return pracType.id;
}

export async function listQuestionsAction(pracTypeCode: PracticeTypeCode): Promise<QuestionWithAnswers[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const pracTypeIdValue = await practiceTypeId(pracTypeCode);
  const rows = await prisma.question.findMany({
    where: { pracTypeId: pracTypeIdValue },
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

export async function createQuestionAction(
  pracTypeCode: PracticeTypeCode,
  input: {
    vocabId: string;
    questionText: string;
    explanation?: string;
    answers: { ansText: string; isCorrect: boolean }[];
  }
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const pracTypeIdValue = await practiceTypeId(pracTypeCode);
  await prisma.question.create({
    data: {
      vocabId: input.vocabId,
      pracTypeId: pracTypeIdValue,
      questionText: input.questionText,
      explanation: input.explanation,
      // Admin is the sole author here — no separate reviewer exists, so content goes live
      // immediately rather than sitting in an approval queue. "rejected" is repurposed by the UI
      // as a simple hide toggle admin can flip anytime.
      status: "approved",
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

export async function deleteQuestionAction(id: string): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền thực hiện thao tác này." };

  const deleted = await prisma.question.delete({ where: { id } }).catch(() => null);
  if (!deleted) return { error: "Không thể xóa câu hỏi này. Câu hỏi có thể đã có học sinh làm bài." };
  return {};
}
