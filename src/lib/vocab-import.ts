import type { PartOfSpeech } from "@/types";

/**
 * Shared parsing rules for the admin's "Import Excel" vocabulary flow (vocabulary-client.tsx).
 * Kept in a plain module (not "use client"/"use server") so the pure logic is unit-testable
 * without a browser — see vocab-import.test.ts.
 */

export const POS_VALUES: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "interjection",
];

export interface ImportRow {
  vocab?: string;
  definition?: string;
  meanVI?: string;
  partOfSpeech?: string;
  ipa?: string;
  topic?: string;
  level?: string;
}

/**
 * Each canonical field accepts these header spellings (matched case-insensitively, trimmed).
 * Covers both the app's own export template (vocab/definition/meanVI/partOfSpeech/ipa/topic/level)
 * and the Cambridge-style enriched vocabulary format used for the A2 import — VocabID/rawLabel/
 * IPA/partOfSpeech/CEFR/meaningVI/definitionEN/exampleEN/exampleVI/primaryTopic/... — so a future
 * A1/B1/B2 file in that same shape imports without needing a one-off script again. exampleEN/
 * exampleVI/VocabID/rawLabel/additionalTopics/etc. are deliberately not in this map: vocabulary
 * import only ever touches the Vocabulary table's own fields, never the separate Question-bank
 * content flow.
 */
const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  vocab: ["vocab"],
  definition: ["definition", "definitionen"],
  meanVI: ["meanvi", "meaningvi"],
  partOfSpeech: ["partofspeech"],
  ipa: ["ipa"],
  topic: ["topic", "primarytopic"],
  level: ["level", "cefr"],
};

/** Matches each expected column against the file's actual header text case-insensitively (and
 * ignoring stray leading/trailing spaces) via HEADER_ALIASES, so a header like "Vocab", "CEFR", or
 * "meaningVI" all map to the right field instead of silently dropping every row. */
export function normalizeImportRow(raw: Record<string, unknown>): ImportRow {
  const byLowerHeader = new Map(Object.keys(raw).map((key) => [key.trim().toLowerCase(), key]));
  const row: ImportRow = {};
  for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [keyof ImportRow, string[]][]) {
    for (const alias of aliases) {
      const actualHeader = byLowerHeader.get(alias);
      if (actualHeader !== undefined) {
        row[column] = raw[actualHeader] as string | undefined;
        break;
      }
    }
  }
  return row;
}

/** Segment -> PartOfSpeech classifiers, checked in this order — the first pattern that matches a
 * segment wins. Short forms are anchored to the WHOLE segment ("^n$") rather than matched as a
 * substring, since a bare single/double letter is too easy to false-positive on. The full words
 * require a word boundary immediately BEFORE them (but not after), so "verb" matches "phrasal
 * verb" and "preposition" matches the prefix "prepositional", while neither wrongly matches inside
 * an unrelated word that merely contains the same letters — "verb" inside "adVERB", or "noun"
 * inside "proNOUN" (a real regression a plain substring check like /verb/ hits immediately). */
const POS_PATTERNS: [pattern: RegExp, pos: PartOfSpeech][] = [
  [/^n$|\bnoun/, "noun"],
  [/^v$|\bverb/, "verb"],
  [/^adj$|\badjective/, "adjective"],
  [/^adv$|\badverb/, "adverb"],
  [/^prep$|\bpreposition/, "preposition"],
  [/^pron$|\bpronoun/, "pronoun"],
  [/^conj$|\bconjunction/, "conjunction"],
  [/^interj$|^excl$|\bexclam|\binterjection/, "interjection"],
];

/** Vocabulary files "in the wild" rarely stick to the app's 8 exact PartOfSpeech values — Cambridge-
 * style lists in particular mix in compound tags ("n & v", "noun phrase", "phrasal verb", "prep
 * phr", "noun/adjective"...) for words used as more than one type or as a multi-word unit.
 * Vocabulary.partOfSpeech is single-valued, so this picks ONE: split the raw tag on common
 * separators (; , & / and the words "phrase"/"phr"), then classify each resulting segment against
 * POS_PATTERNS and return the FIRST one that resolves — this preserves whichever type the file
 * itself listed first as the "primary" sense (e.g. "n & v" -> noun, but "v & n" -> verb).
 * Still returns null (never a guessed fallback) when nothing matches, so a genuinely unrecognized
 * value causes the row to be skipped rather than silently miscategorized. */
export function normalizePartOfSpeech(raw: string | undefined): PartOfSpeech | null {
  if (!raw) return null;
  const lower = raw.trim().toLowerCase();

  const exact = POS_VALUES.find((p) => p === lower);
  if (exact) return exact;

  const segments = lower
    .split(/[;,&/]| phrase| phr/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const segment of segments) {
    const match = POS_PATTERNS.find(([pattern]) => pattern.test(segment));
    if (match) return match[1];
  }
  return null;
}
