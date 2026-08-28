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

/** Cambridge-style files sometimes give a compound part of speech ("noun; verb") for a word used
 * as more than one type — take the first, since Vocabulary.partOfSpeech is single-valued. Returns
 * null (not a fallback) so an unrecognized value still causes the row to be skipped, not silently
 * miscategorized. */
export function normalizePartOfSpeech(raw: string | undefined): PartOfSpeech | null {
  const first = raw
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  return POS_VALUES.find((p) => p === first) ?? null;
}
