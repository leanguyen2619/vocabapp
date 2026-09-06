import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Case- and accent-insensitive equality for typed-answer games (typing/listening/word
 * transformation) — a few vocab words carry a diacritic borrowed from their origin language
 * (e.g. "café", "résumé", "naïve"), and requiring a student to reproduce the exact accent mark
 * tests keyboard trivia, not vocabulary. NFD-decomposes each string into base letters + combining
 * marks, then strips the marks (U+0300-U+036F, the Combining Diacritical Marks block) before
 * comparing, so "cafe" and "café" are treated as the same answer either way. */
export function normalizeForAnswerMatch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

/** Ordinal of B1 in the fixed A1→A2→B1→B2 progression (seeded in that order — see prisma/seed.ts)
 * — used alongside getMyStudentLevelIndexAction (src/lib/actions/levels.ts) to gate features meant
 * for more advanced students, like showing a word's English definition instead of relying solely
 * on the Vietnamese meaning. Lives here rather than in levels.ts because a "use server" file may
 * only export async functions, not plain constants. */
export const B1_LEVEL_ORDINAL = 3;

/** Up to 2 avatar-initial letters from a full name. Collapses repeated whitespace first — a
 * naive `.split(" ")` turns a double space into an empty segment whose first character is
 * `undefined`, which then renders as the literal text "undefined" in the avatar. */
export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase()
}
