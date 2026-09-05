import { prisma } from "@/lib/prisma";

export interface AssignmentRule {
  topicId: number;
  levelId: string;
  count: number;
}

/**
 * Looks at a student's most recent explicit assignment batch (all DailyAssignment rows sharing
 * the latest assignedDate — assignVocabularyToStudentAction/assignVocabularyToAllStudentsAction
 * write every word in one call with the same assignedDate) and, if every word in that batch came
 * from the same topic + level, returns it as a repeatable rule: {topicId, levelId, count}.
 *
 * Only considers "manual" and "auto_continuation" batches — never "auto_default" ones. Without
 * that filter, a student who's simply getting the curriculum-default random pick (no admin
 * decision behind it at all) could land on a batch that happens to be single-topic purely by
 * chance — easy to hit once a level's remaining ready content narrows to one or two topics — and
 * this would then start "pinning" that topic as if an admin had deliberately chosen it, which
 * nobody actually decided.
 *
 * Used by pickTodaysWordIds so that once those explicitly-assigned words are mastered, later days
 * auto-fill a fresh batch of `count` new words from that same topic+level instead of falling back
 * to the generic cross-topic curriculum order — "same settings as last time" without the admin
 * having to separately configure anything beyond the assignment they already made. Returns null for
 * a mixed-topic/mixed-level batch (nothing sensible to repeat) or when nothing's ever been assigned.
 */
export async function deriveLastAssignmentRule(accountId: string): Promise<AssignmentRule | null> {
  const latest = await prisma.dailyAssignment.findFirst({
    where: { accountId, source: { in: ["manual", "auto_continuation"] } },
    orderBy: { assignedDate: "desc" },
    select: { assignedDate: true },
  });
  if (!latest) return null;

  const batch = await prisma.dailyAssignment.findMany({
    where: {
      accountId,
      assignedDate: latest.assignedDate,
      source: { in: ["manual", "auto_continuation"] },
    },
    include: { vocab: { select: { topicId: true, levelId: true } } },
  });
  if (batch.length === 0) return null;

  const topicId = batch[0]!.vocab.topicId;
  const levelId = batch[0]!.vocab.levelId;
  const isHomogeneous = batch.every((a) => a.vocab.topicId === topicId && a.vocab.levelId === levelId);
  if (!isHomogeneous) return null;

  return { topicId, levelId, count: batch.length };
}
