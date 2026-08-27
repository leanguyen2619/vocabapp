"use server";

import { prisma } from "@/lib/prisma";
import { recordForVocab } from "@/lib/progress-core";
import { getCurrentAccount } from "@/lib/session";

/** Minimum score (out of 100) for a graded sentence to count as "got it right" for progress
 * tracking (LearningHistory/AccountLevel via recordForVocab) — below this it's treated the same
 * as a wrong answer, so a shaky sentence doesn't silently advance mastery. */
const PASS_THRESHOLD = 70;

// The textarea has no client-side maxLength today, and even if it did, a Server Action is callable
// directly — so this is the only real backstop against someone submitting a multi-megabyte string.
// One practice sentence has no legitimate reason to be this long.
const MAX_SENTENCE_LENGTH = 1000;
const MAX_FEEDBACK_LENGTH = 1000;

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

export async function submitSentenceAction(
  vocabId: string,
  sentence: string
): Promise<{ ok: true } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const trimmed = sentence.trim();
  if (!trimmed) return { error: "Vui lòng viết một câu trước khi nộp." };
  if (trimmed.length > MAX_SENTENCE_LENGTH) {
    return { error: `Câu quá dài (tối đa ${MAX_SENTENCE_LENGTH} ký tự).` };
  }

  const vocab = await prisma.vocabulary.findUnique({ where: { id: vocabId } });
  if (!vocab) return { error: "Không tìm thấy từ vựng này." };

  await prisma.writingSubmission.create({
    data: { accountId: account.id_login, vocabId, sentence: trimmed },
  });
  return { ok: true };
}

export interface PendingSubmissionItem {
  id: string;
  studentId: string;
  studentName: string;
  vocab: string;
  meanVI: string;
  sentence: string;
  submittedAt: Date;
}

/** Oldest-first so the admin naturally works through the backlog in submission order. */
export async function listPendingWritingSubmissionsAction(): Promise<PendingSubmissionItem[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const rows = await prisma.writingSubmission.findMany({
    where: { status: "pending" },
    include: { account: true, vocab: true },
    orderBy: { submittedAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    studentId: r.accountId,
    studentName: r.account.fullName,
    vocab: r.vocab.vocab,
    meanVI: r.vocab.meanVI,
    sentence: r.sentence,
    submittedAt: r.submittedAt,
  }));
}

export async function countPendingWritingSubmissionsAction(): Promise<number> {
  const admin = await requireAdmin();
  if (!admin) return 0;
  return prisma.writingSubmission.count({ where: { status: "pending" } });
}

export interface GradedSubmissionItem extends PendingSubmissionItem {
  score: number;
  feedback: string | null;
  gradedAt: Date;
}

/** Most-recently-graded first — lets the admin double check their last few grades. */
export async function listRecentlyGradedSubmissionsAction(): Promise<GradedSubmissionItem[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const rows = await prisma.writingSubmission.findMany({
    where: { status: "graded" },
    include: { account: true, vocab: true },
    orderBy: { gradedAt: "desc" },
    take: 20,
  });

  return rows.map((r) => ({
    id: r.id,
    studentId: r.accountId,
    studentName: r.account.fullName,
    vocab: r.vocab.vocab,
    meanVI: r.vocab.meanVI,
    sentence: r.sentence,
    submittedAt: r.submittedAt,
    score: r.score!,
    feedback: r.feedback,
    gradedAt: r.gradedAt!,
  }));
}

/** Grades (or re-grades) one submission and feeds the result into the student's real progress —
 * this is the only place recordForVocab runs for sentence_writing now, replacing the old
 * self-assessed confident/practice buttons. */
export async function gradeWritingSubmissionAction(
  submissionId: string,
  score: number,
  feedback: string
): Promise<{ ok: true } | { error: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Bạn không có quyền chấm điểm." };

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return { error: "Điểm phải là số nguyên từ 0 đến 100." };
  }
  if (feedback.trim().length > MAX_FEEDBACK_LENGTH) {
    return { error: `Nhận xét quá dài (tối đa ${MAX_FEEDBACK_LENGTH} ký tự).` };
  }

  const submission = await prisma.writingSubmission.findUnique({
    where: { id: submissionId },
    include: { vocab: true },
  });
  if (!submission) return { error: "Không tìm thấy bài nộp này." };

  const trimmedFeedback = feedback.trim();
  await prisma.writingSubmission.update({
    where: { id: submissionId },
    data: {
      status: "graded",
      score,
      feedback: trimmedFeedback || null,
      gradedAt: new Date(),
      gradedBy: admin.id_login,
    },
  });

  await recordForVocab(submission.accountId, submission.vocabId, submission.vocab.levelId, score >= PASS_THRESHOLD);
  return { ok: true };
}

export interface MySubmissionItem {
  id: string;
  vocab: string;
  meanVI: string;
  sentence: string;
  status: "pending" | "graded";
  score: number | null;
  feedback: string | null;
  submittedAt: Date;
  gradedAt: Date | null;
}

/** Newest-first — a student checking back cares most about their latest submissions. */
export async function listMyWritingSubmissionsAction(): Promise<MySubmissionItem[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const rows = await prisma.writingSubmission.findMany({
    where: { accountId: account.id_login },
    include: { vocab: true },
    orderBy: { submittedAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    vocab: r.vocab.vocab,
    meanVI: r.vocab.meanVI,
    sentence: r.sentence,
    status: r.status,
    score: r.score,
    feedback: r.feedback,
    submittedAt: r.submittedAt,
    gradedAt: r.gradedAt,
  }));
}
