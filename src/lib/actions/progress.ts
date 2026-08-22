"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { LearningStatus } from "@/types";

const STATUS_ORDER: LearningStatus[] = ["new", "learning", "mastered"];

function nextStatus(current: LearningStatus, isCorrect: boolean): LearningStatus {
  const index = STATUS_ORDER.indexOf(current);
  const nextIndex = isCorrect ? Math.min(index + 1, STATUS_ORDER.length - 1) : Math.max(index - 1, 0);
  return STATUS_ORDER[nextIndex];
}

async function recordForVocab(
  accountId: string,
  vocabId: string,
  levelId: string,
  isCorrect: boolean
): Promise<LearningStatus> {
  const existing = await prisma.learningHistory.findUnique({
    where: { accountId_vocabId: { accountId, vocabId } },
  });
  const status = nextStatus(existing?.status ?? "new", isCorrect);

  await prisma.learningHistory.upsert({
    where: { accountId_vocabId: { accountId, vocabId } },
    update: { status, lastDate: new Date() },
    create: { accountId, vocabId, status },
  });

  const [level, levelVocab, levelHistory] = await Promise.all([
    prisma.level.findUnique({ where: { id: levelId } }),
    prisma.vocabulary.findMany({ where: { levelId }, select: { id: true } }),
    prisma.learningHistory.findMany({
      where: { accountId, vocab: { levelId } },
      select: { status: true },
    }),
  ]);
  if (!level) return status;

  const masteredCount = levelHistory.filter((h) => h.status === "mastered").length;
  const score = levelVocab.length > 0 ? Math.round((masteredCount / levelVocab.length) * 100) : 0;
  const levelStatus = score >= level.maxScore ? "completed" : "in_progress";

  await prisma.accountLevel.upsert({
    where: { accountId_levelId: { accountId, levelId } },
    update: { score, status: levelStatus },
    create: { accountId, levelId, score, status: levelStatus },
  });

  return status;
}

/**
 * Records the outcome of a student answering a question about one vocabulary word, advancing or
 * demoting its LearningHistory status, then recomputes that word's Level score/status so
 * completing a level (and unlocking the next one) reflects real practice instead of only an
 * admin's manual override.
 */
export async function recordVocabAttemptAction(
  vocabId: string,
  isCorrect: boolean
): Promise<{ status: LearningStatus } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const vocab = await prisma.vocabulary.findUnique({ where: { id: vocabId } });
  if (!vocab) return { error: "Không tìm thấy từ vựng này." };

  const status = await recordForVocab(account.id_login, vocabId, vocab.levelId, isCorrect);
  return { status };
}

/**
 * Same as recordVocabAttemptAction, but for the handful of practice games (synonym/antonym,
 * fill-blank, word-formation, sentence-writing) still built on a static content pool that
 * predates the real Vocabulary table and has no vocabId of its own. Looks up the matching
 * Vocabulary row by exact word text and silently no-ops if none exists, rather than erroring —
 * this is a best-effort bridge, not a guarantee, until that content is migrated into the DB.
 */
export async function recordVocabAttemptByWordAction(
  word: string,
  isCorrect: boolean
): Promise<{ status: LearningStatus } | { skipped: true } | { error: string }> {
  const account = await getCurrentAccount();
  if (!account) return { error: "Bạn cần đăng nhập." };

  const vocab = await prisma.vocabulary.findFirst({ where: { vocab: { equals: word, mode: "insensitive" } } });
  if (!vocab) return { skipped: true };

  const status = await recordForVocab(account.id_login, vocab.id, vocab.levelId, isCorrect);
  return { status };
}
