// Shuffle-prep helpers for exercise types whose client component needs pre-shuffled, non-trivial
// shapes (not just a shuffled array of the raw questions — see practice-content.ts). Kept in a
// plain module (no "use client") so Server Components can call them directly when building props
// — the shuffle must happen server-side and be passed down as-is, never re-shuffled on the
// client, or SSR and hydration would each pick a different random order and React would throw a
// hydration-mismatch error. See the "Already shuffled" comments on the client components that
// consume these.

import type { PosClassificationItem } from "@/lib/actions/vocabulary";
import type { WordFormationItem } from "@/lib/actions/practice-content";
import { shuffle } from "@/lib/utils";
import type { PartOfSpeech } from "@/types";

const POS_OPTIONS: PartOfSpeech[] = ["noun", "verb", "adjective", "adverb"];

export interface PosQuestion {
  item: PosClassificationItem;
  options: PartOfSpeech[];
}

export function buildPosQuestions(items: PosClassificationItem[]): PosQuestion[] {
  return items.map((item) => ({ item, options: shuffle(POS_OPTIONS) }));
}

export interface Tile {
  id: number;
  char: string;
}

export interface PreparedPrompt extends WordFormationItem {
  tiles: Tile[];
}

export function prepareWordFormation(prompts: WordFormationItem[]): PreparedPrompt[] {
  return shuffle(prompts).map((p) => ({
    ...p,
    tiles: shuffle(p.word.split("").map((char, id) => ({ id, char }))),
  }));
}
