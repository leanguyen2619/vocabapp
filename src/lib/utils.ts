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

/**
 * A vocab word can pack several accepted spellings into one string using the dictionary notation
 * our source spreadsheets already use:
 *   - "A / B" — either alternative counts: "v / versus", "television / TV", "grey / gray"
 *   - "word (extra)" or "word(extra)" — the parenthetical is optional: "DVD (player)" accepts both
 *     "DVD" and "DVD player"; "exam(ination)" accepts "exam" and "examination"; "sport(s)" accepts
 *     "sport" and "sports"
 *   - "[x]" behaves the same as "(x)" — "gram(me)" → "gram"/"gramme"
 * Groups combine ("kilo(gram[me])/kg" → kilo, kilogram, kilogramme, kg) and slash alternatives
 * that share a prefix or suffix are reconstructed ("city / town centre" also accepts "city
 * centre", "quarter (past/to)" also accepts "quarter to"). Used by the typed-answer games so a
 * student is never forced to type a word's full form or every listed variant.
 */
export function expandAcceptedAnswers(raw: string): string[] {
  const out = new Set<string>()
  for (const variant of expandOptionalGroups(raw)) {
    for (const form of splitSlashAlternatives(variant)) {
      const cleaned = form.replace(/\s+/g, " ").trim()
      if (cleaned) out.add(cleaned)
    }
  }
  return out.size > 0 ? [...out] : [raw.trim()]
}

/** True if `typed` matches `answer` under normalizeForAnswerMatch, allowing for any of the
 * accepted spellings encoded in `answer` (see expandAcceptedAnswers). */
export function isAcceptedAnswer(typed: string, answer: string): boolean {
  const normalizedTyped = normalizeForAnswerMatch(typed)
  if (!normalizedTyped) return false
  return expandAcceptedAnswers(answer).some(
    (candidate) => normalizeForAnswerMatch(candidate) === normalizedTyped
  )
}

/** Recursively turns every "(x)" / "[x]" group into two variants — one keeping the inner text,
 * one dropping the group entirely — so N optional groups yield up to 2^N spellings. */
function expandOptionalGroups(input: string): string[] {
  const group = input.match(/[([]([^()[\]]*)[)\]]/)
  if (!group || group.index === undefined) return [input]
  const before = input.slice(0, group.index)
  const after = input.slice(group.index + group[0].length)
  const results = new Set<string>()
  for (const v of expandOptionalGroups(before + group[1] + after)) results.add(v)
  for (const v of expandOptionalGroups(before + after)) results.add(v)
  return [...results]
}

function splitSlashAlternatives(input: string): string[] {
  if (!input.includes("/")) return [input]
  const parts = input
    .split("/")
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
  if (parts.length < 2) return parts.length > 0 ? parts : [input]

  const forms = new Set<string>(parts)
  // "city / town centre" and "quarter past / to" list alternatives that share a prefix or suffix
  // with the wordiest part — let each shorter part borrow the missing words from it so the
  // combined form ("city centre", "quarter to") is accepted too.
  const wordLists = parts.map((p) => p.split(" "))
  const template = wordLists.reduce((a, b) => (b.length > a.length ? b : a))
  for (const words of wordLists) {
    if (words.length >= template.length) continue
    forms.add([...template.slice(0, template.length - words.length), ...words].join(" "))
    forms.add([...words, ...template.slice(words.length)].join(" "))
  }
  return [...forms]
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
