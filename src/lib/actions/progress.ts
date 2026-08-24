"use server";

import { prisma } from "@/lib/prisma";
import { recordForVocab } from "@/lib/progress-core";
import { getCurrentAccount } from "@/lib/session";
import type { LearningStatus } from "@/types";

/**
 * Records the outcome of a student answering a question about one vocabulary word, advancing or
 * demoting its LearningHistory status, then recomputes that word's Level score/status so
 * completing a level (and unlocking the next one) reflects real practice instead of only an
 * admin's manual override.
 *
 * Used by the self-assessed/free-input games (flashcard, matching, typing, listening, POS
 * classification, word formation, sentence writing) where `isCorrect` genuinely comes from the
 * student's own input or self-report, not a hidden multiple-choice answer — those pull from
 * either the daily-word pool (level-gated) or, for POS classification by design, the full bank.
 * Question-bank multiple-choice games (Quiz, Synonym/Antonym, Fill-blank) instead grade
 * server-side via their own submit actions, since trusting a client-supplied `isCorrect` there
 * would let a student answer every question "correctly" without the server ever checking.
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
