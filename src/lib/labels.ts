import type { Level, Topic } from "@/types";

export function getTopicName(topics: Topic[], topicId: number): string {
  return topics.find((t) => t.id === topicId)?.topic ?? String(topicId);
}

export function getLevelName(levels: Level[], levelId: string): string {
  return levels.find((l) => l.id === levelId)?.level ?? levelId;
}
