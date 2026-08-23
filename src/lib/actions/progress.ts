"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentAccount } from "@/lib/session";
import type { AccountLevelStatus, LearningStatus } from "@/types";

const STATUS_ORDER: LearningStatus[] = ["new", "learning", "mastered"];
const LEVEL_STATUS_RANK: Record<AccountLevelStatus, number> = { locked: 0, in_progress: 1, completed: 2 };

function nextStatus(current: LearningStatus, isCorrect: boolean): LearningStatus {
  const index = STATUS_ORDER.indexOf(current);
  const nextIndex = isCorrect ? Math.min(index + 1, STATUS_ORDER.length - 1) : Math.max(index - 1, 0);
  return STATUS_ORDER[nextIndex];
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isNextCalendarDay(previous: Date, current: Date): boolean {
  const prevDay = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
  const currentDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const diffDays = Math.round((currentDay.getTime() - prevDay.getTime()) / 86_400_000);
  return diffDays === 1;
}

/** Consecutive-day streak: +1 if practiced the day right after the last activity, reset to 1 on
 * any gap, unchanged if already counted today. */
function computeStreak(currentStreak: number, lastActivityDate: Date | null, now: Date): number {
  if (!lastActivityDate) return 1;
  if (isSameCalendarDay(lastActivityDate, now)) return Math.max(currentStreak, 1);
  if (isNextCalendarDay(lastActivityDate, now)) return currentStreak + 1;
  return 1;
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

  const [level, levelVocab, levelHistory, existingAccountLevel] = await Promise.all([
    prisma.level.findUnique({ where: { id: levelId } }),
    prisma.vocabulary.findMany({ where: { levelId }, select: { id: true } }),
    prisma.learningHistory.findMany({
      where: { accountId, vocab: { levelId } },
      select: { status: true },
    }),
    prisma.accountLevel.findUnique({ where: { accountId_levelId: { accountId, levelId } } }),
  ]);
  if (!level) return status;

  const masteredCount = levelHistory.filter((h) => h.status === "mastered").length;
  const score = levelVocab.length > 0 ? Math.round((masteredCount / levelVocab.length) * 100) : 0;
  const naturalStatus: AccountLevelStatus = score >= level.maxScore ? "completed" : "in_progress";

  // Never let this auto-recompute demote a level's status — only ever match or improve on
  // whatever it already was. This keeps an admin's manual "completed" override durable instead
  // of it silently reverting the next time the student answers something in that level.
  const currentStatus = existingAccountLevel?.status ?? "locked";
  const levelStatus =
    LEVEL_STATUS_RANK[naturalStatus] > LEVEL_STATUS_RANK[currentStatus] ? naturalStatus : currentStatus;

  const now = new Date();
  const streak = computeStreak(
    existingAccountLevel?.streak ?? 0,
    existingAccountLevel?.lastActivityDate ?? null,
    now
  );

  await prisma.accountLevel.upsert({
    where: { accountId_levelId: { accountId, levelId } },
    update: { score, status: levelStatus, streak, lastActivityDate: now },
    create: { accountId, levelId, score, status: levelStatus, streak, lastActivityDate: now },
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
