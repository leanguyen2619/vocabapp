import type { PracticeTypeCode } from "@/types";

/**
 * Which word pool a word-driven game (Quiz, Flashcard, Matching, Typing, Listening) draws from —
 * picked via the category selector on /exercises and carried through as a `?scope=` search param.
 * Not a "use server" module (unlike vocabulary.ts/exercise-types.ts, which only implement it) so
 * this type, its parser, and the affected-type list can be shared as plain, synchronous exports
 * across every page that reads the param — a "use server" file may only export async functions.
 */
export const WORD_SCOPES = ["new", "mixed", "old"] as const;
export type WordScope = (typeof WORD_SCOPES)[number];

export function parseWordScope(value: string | undefined): WordScope {
  return (WORD_SCOPES as readonly string[]).includes(value ?? "") ? (value as WordScope) : "mixed";
}

/** Practice types whose content is pulled straight from the vocabulary bank (not the Question
 * Bank), so the /exercises category picker only applies to these — the other 4 types draw from
 * admin-curated Question rows that aren't scoped by word status. */
export const WORD_SCOPED_CODES: PracticeTypeCode[] = [
  "multiple_choice",
  "flashcard",
  "matching",
  "typing",
  "listening",
];
