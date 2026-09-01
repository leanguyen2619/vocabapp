"use server";

import { prisma } from "@/lib/prisma";
import { getMyStudentLevelIndexAction, listLevelsAction } from "@/lib/actions/levels";
import { getCurrentAccount } from "@/lib/session";
import type { PracticeTypeCode } from "@/types";

async function requireAdmin() {
  const account = await getCurrentAccount();
  if (!account || account.role !== "admin") return null;
  return account;
}

/** Route to the built exercise, or null if not implemented yet — static, not stored in DB. */
const HREF_BY_CODE: Record<PracticeTypeCode, string | null> = {
  multiple_choice: "/quiz",
  flashcard: "/practice",
  matching: "/practice/matching",
  pos_classification: "/practice/pos",
  sentence_writing: "/practice/writing",
  synonym_antonym: "/practice/synonym-antonym",
  fill_blank: "/practice/fill-blank",
  word_formation: "/practice/word-formation",
  word_transformation: "/practice/word-transformation",
  typing: "/practice/typing",
  listening: "/practice/listening",
  listening_comprehension: "/practice/listening-comprehension",
  reading_comprehension: "/practice/reading-comprehension",
};

export interface ExerciseTypeSummary {
  code: PracticeTypeCode;
  name: string;
  description: string;
  level: number; // ordinal 1-4, derived from the PracticeType's levelId
  enabled: boolean;
  href: string | null;
}

export async function listExerciseTypesAction(): Promise<ExerciseTypeSummary[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const [levels, practiceTypes] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.practiceType.findMany({ orderBy: { type: "asc" } }),
  ]);
  const ordinalByLevelId = new Map(levels.map((l, i) => [l.id, i + 1]));

  return practiceTypes.map((pt) => ({
    code: pt.type,
    name: pt.name,
    description: pt.description,
    level: ordinalByLevelId.get(pt.levelId) ?? 1,
    enabled: pt.enabled,
    href: HREF_BY_CODE[pt.type],
  }));
}

/**
 * Same visibility rule the /exercises page applies (enabled + level unlocked for students, all
 * enabled types for teacher/admin) — used by RandomExerciseButton on every game page so "shuffle
 * to another exercise" can't jump a student ahead into a type above their current level.
 */
export async function listVisibleExerciseTypesAction(): Promise<ExerciseTypeSummary[]> {
  const account = await getCurrentAccount();
  if (!account) return [];

  const [types, levels, studentLevelIndex] = await Promise.all([
    listExerciseTypesAction(),
    listLevelsAction(),
    account.role === "student" ? getMyStudentLevelIndexAction() : Promise.resolve(null),
  ]);
  const maxLevel = studentLevelIndex ?? levels.length;
  return types.filter((t) => t.enabled && t.level <= maxLevel);
}

export async function updateExerciseTypeAction(
  code: PracticeTypeCode,
  patch: { name?: string; description?: string; enabled?: boolean; level?: number }
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  let levelId: string | undefined;
  if (patch.level !== undefined) {
    const levels = await prisma.level.findMany({ orderBy: { id: "asc" } });
    levelId = levels[patch.level - 1]?.id;
    // Out-of-range level: fail loudly instead of silently dropping the level change.
    if (!levelId) return false;
  }

  const updated = await prisma.practiceType
    .update({
      where: { type: code },
      data: { name: patch.name, description: patch.description, enabled: patch.enabled, levelId },
    })
    .catch(() => null);
  return updated !== null;
}
