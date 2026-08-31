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
  // instead of one waiting on the other. allLevels (ordered) is only needed to find whichever
  // level comes right after this one, for the auto-unlock check below.
  const [existing, level, totalVocabInLevel, masteredCountBefore, existingAccountLevel, allLevels] =
    await Promise.all([
      prisma.learningHistory.findUnique({ where: { accountId_vocabId: { accountId, vocabId } } }),
      prisma.level.findUnique({ where: { id: levelId } }),
      prisma.vocabulary.count({ where: { levelId } }),
      prisma.learningHistory.count({ where: { accountId, status: "mastered", vocab: { levelId } } }),
      prisma.accountLevel.findUnique({ where: { accountId_levelId: { accountId, levelId } } }),
      prisma.level.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
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

    // Silent auto-unlock: once this level's own mastery % crosses its configured threshold, the
    // next level opens up on its own — no admin action, no toast/notice to the student. This is
    // deliberately independent of levelStatus/naturalStatus above, so THIS level keeps showing
    // its real, unrounded progress (not a premature "completed" trophy) right up until it
    // actually reaches 100%. Never downgrades the next level's status if it's already
    // in_progress/completed by some other means (admin override, or having reached its own
    // threshold from a previous answer).
    if (level.autoUnlockNextAt !== null && score >= level.autoUnlockNextAt) {
      const currentIndex = allLevels.findIndex((l) => l.id === levelId);
      const nextLevel = currentIndex >= 0 ? allLevels[currentIndex + 1] : undefined;
      if (nextLevel) {
        const nextAccountLevel = await prisma.accountLevel.findUnique({
          where: { accountId_levelId: { accountId, levelId: nextLevel.id } },
        });
        if ((nextAccountLevel?.status ?? "locked") === "locked") {
          writes.push(
            prisma.accountLevel.upsert({
              where: { accountId_levelId: { accountId, levelId: nextLevel.id } },
              update: { status: "in_progress" },
              create: { accountId, levelId: nextLevel.id, status: "in_progress", score: 0, streak: 0 },
            })
          );
        }
      }
    }
  }

  await Promise.all(writes);
  return status;
}
