import type { LearningStatus } from "@/types";

/**
 * Pure aggregation logic for the admin class-weakness report, split out of
 * src/lib/actions/class-report.ts (a "use server" file, which may only export async functions)
 * so this business logic is unit testable without a database — see class-report-core.test.ts.
 * Mirrors the progress.ts / progress-core.ts split already used for recordForVocab.
 */

export interface WeakWordItem {
  vocabId: string;
  vocab: string;
  meanVI: string;
  levelName: string;
  attempted: number;
  notMasteredCount: number;
  notMasteredPercent: number;
}

export interface VocabInfo {
  id: string;
  vocab: string;
  meanVI: string;
  levelName: string;
}

export interface HistoryRow {
  vocabId: string;
  status: LearningStatus;
}

const MAX_MIN_ATTEMPTED = 3;

/**
 * The minimum-attempts bar scales down for a small class: requiring 3 attempts would leave the
 * report permanently empty for a class of 1-2 students, which reads as "broken" rather than "not
 * enough data yet". Never goes below 1 (a class of 0 students has nothing to report either way).
 */
export function computeMinAttempted(studentCount: number): number {
  return Math.max(1, Math.min(MAX_MIN_ATTEMPTED, studentCount));
}

/**
 * For every word at least minAttempted (derived from studentCount) students have engaged with,
 * the share who haven't reached "mastered" yet — the best available proxy for "the class is weak
 * on this word" since there's no per-attempt right/wrong log yet (ExerciseAttempt exists in the
 * schema but nothing writes to it). LearningHistory.status already captures the same signal
 * indirectly: recordForVocab advances it on a correct answer and regresses it on a wrong one, so a
 * word stuck at new/learning for most of the class really does mean the class keeps getting it
 * wrong. Sorted worst-first, capped at 20 so an admin sees exactly what to reteach without wading
 * through the whole vocabulary bank.
 */
export function buildWeakWordsReport(
  histories: HistoryRow[],
  vocabulary: VocabInfo[],
  studentCount: number
): WeakWordItem[] {
  const minAttempted = computeMinAttempted(studentCount);

  const vocabById = new Map(vocabulary.map((v) => [v.id, v]));
  const counts = new Map<string, { total: number; notMastered: number }>();
  for (const h of histories) {
    const entry = counts.get(h.vocabId) ?? { total: 0, notMastered: 0 };
    entry.total += 1;
    if (h.status !== "mastered") entry.notMastered += 1;
    counts.set(h.vocabId, entry);
  }

  const report: WeakWordItem[] = [];
  for (const [vocabId, { total, notMastered }] of counts) {
    if (total < minAttempted) continue;
    const vocab = vocabById.get(vocabId);
    if (!vocab) continue;
    report.push({
      vocabId,
      vocab: vocab.vocab,
      meanVI: vocab.meanVI,
      levelName: vocab.levelName,
      attempted: total,
      notMasteredCount: notMastered,
      notMasteredPercent: Math.round((notMastered / total) * 100),
    });
  }

  return report
    .sort((a, b) => b.notMasteredPercent - a.notMasteredPercent || b.attempted - a.attempted)
    .slice(0, 20);
}
