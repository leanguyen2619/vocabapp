import { prisma } from "@/lib/prisma";

/**
 * Level ids the student has unlocked: level 1 is open by default, each further level opens once
 * the previous one is in_progress/completed. Shared by daily-word selection and every
 * practice-content list/submit action so "locked" means the same thing everywhere, including for
 * direct server-action calls that skip the UI entirely.
 */
export async function computeUnlockedLevelIds(accountId: string): Promise<Set<string>> {
  const [levels, accountLevels] = await Promise.all([
    prisma.level.findMany({ orderBy: { id: "asc" } }),
    prisma.accountLevel.findMany({ where: { accountId } }),
  ]);

  let unlockedIndex = 1;
  levels.forEach((level, index) => {
    const status = accountLevels.find((al) => al.levelId === level.id)?.status ?? "locked";
    if (status === "completed" || status === "in_progress") unlockedIndex = index + 1;
  });

  return new Set(levels.slice(0, unlockedIndex).map((l) => l.id));
}
