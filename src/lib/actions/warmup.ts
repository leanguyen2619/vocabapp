"use server";

import { prisma } from "@/lib/prisma";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import {
  getFillBlankQuestionsAction,
  getListeningComprehensionQuestionsAction,
  getMyReadingPassageAction,
  getMyReadingTextAction,
  getSentenceWritingPromptsAction,
  getSynonymAntonymQuestionsAction,
  getWordFormationPromptsAction,
  getWordTransformationPromptsAction,
} from "@/lib/actions/practice-content";
import { getMyQuizQuestionsAction, getMyWordsForScopeAction, getPosClassificationItemsAction } from "@/lib/actions/vocabulary";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import type { PracticeTypeCode } from "@/types";

const WARMUP_SIZE = 3;

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Whether a practice type actually has at least one item this student could be given today —
 * checked before offering it as one of the mandatory 3, so a warmup step never dead-ends on an
 * empty question list with nowhere to go (the normal "no questions" screens link to /exercises,
 * which is exactly what warmup mode blocks). */
async function typeHasContent(code: PracticeTypeCode): Promise<boolean> {
  switch (code) {
    case "multiple_choice":
      return (await getMyQuizQuestionsAction("mixed")).length > 0;
    case "matching":
    case "typing":
    case "listening":
      return (await getMyWordsForScopeAction("mixed")).length > 0;
    case "pos_classification":
      return (await getPosClassificationItemsAction()).length > 0;
    case "synonym_antonym":
      return (await getSynonymAntonymQuestionsAction()).length > 0;
    case "fill_blank":
      return (await getFillBlankQuestionsAction()).length > 0;
    case "word_formation":
      return (await getWordFormationPromptsAction()).length > 0;
    case "word_transformation":
      return (await getWordTransformationPromptsAction()).length > 0;
    case "sentence_writing":
      return (await getSentenceWritingPromptsAction()).length > 0;
    case "listening_comprehension":
      return (await getListeningComprehensionQuestionsAction()).length > 0;
    case "reading_comprehension":
      return (await getMyReadingPassageAction()) !== null;
    case "reading_practice":
      return (await getMyReadingTextAction()) !== null;
    case "flashcard":
      return false;
  }
}

/** Picks up to 3 distinct, level-appropriate, non-flashcard practice types that actually have
 * content for this student. Runs at most once per student per day (the caller only invokes this
 * when today's DailyWarmup row doesn't exist yet), so the sequential availability checks below
 * are fine — this isn't a hot path. */
async function selectWarmupTypes(): Promise<PracticeTypeCode[]> {
  const visible = await listVisibleExerciseTypesAction();
  const candidates = shuffle(visible.filter((t) => t.code !== "flashcard").map((t) => t.code));

  const selected: PracticeTypeCode[] = [];
  for (const code of candidates) {
    if (selected.length >= WARMUP_SIZE) break;
    if (await typeHasContent(code)) selected.push(code);
  }
  return selected;
}

async function getOrCreateTodaysWarmup(accountId: string) {
  const warmupDate = startOfToday();

  const existing = await prisma.dailyWarmup.findUnique({
    where: { accountId_warmupDate: { accountId, warmupDate } },
  });
  if (existing) return existing;

  const practiceTypeCodes = await selectWarmupTypes();
  return prisma.dailyWarmup
    .create({ data: { accountId, warmupDate, practiceTypeCodes, completedCodes: [] } })
    .catch(() =>
      // Lost a create race against a concurrent request for the same student+day — read back
      // whichever row won instead of surfacing a unique-constraint error.
      prisma.dailyWarmup.findUniqueOrThrow({ where: { accountId_warmupDate: { accountId, warmupDate } } })
    );
}

export interface WarmupStatus {
  types: PracticeTypeCode[];
  completed: PracticeTypeCode[];
}

/** Null for non-students (and logged-out visitors) — the warmup requirement doesn't apply to
 * them, so callers should treat null as "nothing to gate". */
export async function getMyWarmupStatusAction(): Promise<WarmupStatus | null> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "student") return null;

  const row = await getOrCreateTodaysWarmup(account.id_login);
  return { types: row.practiceTypeCodes, completed: row.completedCodes };
}

/** Called by a warmup-mode game the moment it reaches its finished/results screen. Re-verifies
 * the type is actually one of today's assigned types (not just trusting the client-passed code)
 * and is idempotent — completing the same type twice (e.g. after "Làm lại") is a no-op. */
export async function markWarmupTypeCompleteAction(code: PracticeTypeCode): Promise<void> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "student") return;

  const warmupDate = startOfToday();
  const existing = await prisma.dailyWarmup.findUnique({
    where: { accountId_warmupDate: { accountId: account.id_login, warmupDate } },
  });
  if (!existing) return;
  if (!existing.practiceTypeCodes.includes(code)) return;
  if (existing.completedCodes.includes(code)) return;

  await prisma.dailyWarmup.update({
    where: { accountId_warmupDate: { accountId: account.id_login, warmupDate } },
    data: { completedCodes: { push: code } },
  });
}
