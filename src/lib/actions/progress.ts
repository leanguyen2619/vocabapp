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

  const existing = await prisma.learningHistory.findUnique({
    where: { accountId_vocabId: { accountId: account.id_login, vocabId } },
  });
  const status = nextStatus(existing?.status ?? "new", isCorrect);

  await prisma.learningHistory.upsert({
    where: { accountId_vocabId: { accountId: account.id_login, vocabId } },
    update: { status, lastDate: new Date() },
    create: { accountId: account.id_login, vocabId, status },
  });

  const [level, levelVocab, levelHistory] = await Promise.all([
    prisma.level.findUnique({ where: { id: vocab.levelId } }),
    prisma.vocabulary.findMany({ where: { levelId: vocab.levelId }, select: { id: true } }),
    prisma.learningHistory.findMany({
      where: { accountId: account.id_login, vocab: { levelId: vocab.levelId } },
      select: { status: true },
    }),
  ]);
  if (!level) return { status };

  const masteredCount = levelHistory.filter((h) => h.status === "mastered").length;
  const score = levelVocab.length > 0 ? Math.round((masteredCount / levelVocab.length) * 100) : 0;
  const levelStatus = score >= level.maxScore ? "completed" : "in_progress";

  await prisma.accountLevel.upsert({
    where: { accountId_levelId: { accountId: account.id_login, levelId: vocab.levelId } },
    update: { score, status: levelStatus },
    create: { accountId: account.id_login, levelId: vocab.levelId, score, status: levelStatus },
  });

  return { status };
}
