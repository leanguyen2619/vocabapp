import type { Level, PartOfSpeech, Topic } from "@/types";

export const posLabel: Record<PartOfSpeech, string> = {
  noun: "danh từ",
  verb: "động từ",
  adjective: "tính từ",
  adverb: "trạng từ",
  preposition: "giới từ",
  pronoun: "đại từ",
  conjunction: "liên từ",
  interjection: "thán từ",
};

export function getTopicName(topics: Topic[], topicId: number): string {
  return topics.find((t) => t.id === topicId)?.topic ?? String(topicId);
}

export function getLevelName(levels: Level[], levelId: string): string {
  return levels.find((l) => l.id === levelId)?.level ?? levelId;
}
