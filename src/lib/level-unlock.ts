import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

/**
 * Level ids the student has unlocked: level 1 is open by default, each further level opens once
 * the previous one is in_progress/completed. Shared by daily-word selection and every
 * practice-content list/submit action so "locked" means the same thing everywhere, including for
 * direct server-action calls that skip the UI entirely.
 *
 * Pass `role` only when `accountId` is the CURRENTLY LOGGED-IN caller's own account (i.e. every
 * "get my content" action) — an admin has no AccountLevel progress of their own (they don't
 * "level up"), so without this every admin was silently capped at A1-only content everywhere,
 * including this session's own admin account, the moment they browsed anything themselves rather
 * than a student's. Never pass it when checking a DIFFERENT account's (e.g. a student's) real
 * unlock status on an admin's behalf — see getAccountLevelStatusesAction/students.ts, which
 * correctly omits it since that's checking what the STUDENT can access, not the admin.
 */
export async function computeUnlockedLevelIds(accountId: string, role?: Role): Promise<Set<string>> {
  if (role === "admin") {
    const levels = await prisma.level.findMany({ orderBy: { id: "asc" } });
    return new Set(levels.map((l) => l.id));
  }

  // Independent of each other — fetched in parallel rather than as two sequential round trips,
  // since this runs on nearly every "get my content" action (~20 call sites).
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
