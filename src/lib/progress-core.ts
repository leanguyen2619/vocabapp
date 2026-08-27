import { prisma } from "@/lib/prisma";
import type { AccountLevelStatus, LearningStatus } from "@/types";

const STATUS_ORDER: LearningStatus[] = ["new", "learning", "mastered"];
const LEVEL_STATUS_RANK: Record<AccountLevelStatus, number> = { locked: 0, in_progress: 1, completed: 2 };

// Exported (not just used internally) so this business-critical status/streak logic is unit
// testable without a database — see progress-core.test.ts.

export function nextStatus(current: LearningStatus, isCorrect: boolean): LearningStatus {
  const index = STATUS_ORDER.indexOf(current);
  const nextIndex = isCorrect ? Math.min(index + 1, STATUS_ORDER.length - 1) : Math.max(index - 1, 0);
  return STATUS_ORDER[nextIndex];
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isNextCalendarDay(previous: Date, current: Date): boolean {
  const prevDay = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
  const currentDay = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const diffDays = Math.round((currentDay.getTime() - prevDay.getTime()) / 86_400_000);
  return diffDays === 1;
}

/** Consecutive-day streak: +1 if practiced the day right after the last activity, reset to 1 on
 * any gap, unchanged if already counted today. */
export function computeStreak(currentStreak: number, lastActivityDate: Date | null, now: Date): number {
  if (!lastActivityDate) return 1;
  if (isSameCalendarDay(lastActivityDate, now)) return Math.max(currentStreak, 1);
  if (isNextCalendarDay(lastActivityDate, now)) return currentStreak + 1;
  return 1;
}

/**
 * Not a Server Action — deliberately kept out of any "use server" file. It takes accountId as a
 * plain argument rather than deriving it from the session, so exporting it from a "use server"
 * module would let any client call it directly to write progress onto an arbitrary account.
 * Callers (progress.ts, vocabulary.ts, practice-content.ts) must derive accountId from
 * getCurrentAccount() themselves before calling this.
 */
export async function recordForVocab(
  accountId: string,
  vocabId: string,
  levelId: string,
  isCorrect: boolean
): Promise<LearningStatus> {
  // Every read this needs is independent of the writes below, so they all go in one round trip
  // — masteredCountBefore and totalVocabInLevel are aggregate counts (not full row fetches)
  // specifically so the post-write mastered count can be derived arithmetically instead of
  // re-querying after the write, which is what let the two writes below also run in parallel
  // instead of one waiting on the other.
  const [existing, level, totalVocabInLevel, masteredCountBefore, existingAccountLevel] = await Promise.all([
    prisma.learningHistory.findUnique({ where: { accountId_vocabId: { accountId, vocabId } } }),
    prisma.level.findUnique({ where: { id: levelId } }),
    prisma.vocabulary.count({ where: { levelId } }),
    prisma.learningHistory.count({ where: { accountId, status: "mastered", vocab: { levelId } } }),
    prisma.accountLevel.findUnique({ where: { accountId_levelId: { accountId, levelId } } }),
  ]);

  const previousStatus = existing?.status ?? "new";
  const status = nextStatus(previousStatus, isCorrect);

  const writes: Promise<unknown>[] = [
    prisma.learningHistory.upsert({
      where: { accountId_vocabId: { accountId, vocabId } },
      update: { status, lastDate: new Date() },
      create: { accountId, vocabId, status },
    }),
  ];

  if (level) {
    const masteredCount =
      masteredCountBefore + (status === "mastered" ? 1 : 0) - (previousStatus === "mastered" ? 1 : 0);
    const score = totalVocabInLevel > 0 ? Math.round((masteredCount / totalVocabInLevel) * 100) : 0;
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

    writes.push(
      prisma.accountLevel.upsert({
        where: { accountId_levelId: { accountId, levelId } },
        update: { score, status: levelStatus, streak, lastActivityDate: now },
        create: { accountId, levelId, score, status: levelStatus, streak, lastActivityDate: now },
      })
    );
  }

  await Promise.all(writes);
  return status;
}
