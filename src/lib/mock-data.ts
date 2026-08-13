import type { AssignmentStatus, Vocabulary } from "@/types";

// ---------- Teacher dashboard demo data ----------
// The teacher role has no function spec from the user yet (unlike student/admin), so its
// dashboard stays presentational demo content until that spec exists.

export interface ClassStudent {
  id: string;
  fullName: string;
  levelName: string;
  score: number;
  streak: number;
  masteredVocab: number;
  todayStatus: AssignmentStatus;
}

export const classStudents: ClassStudent[] = [
  { id: "acc_101", fullName: "Trần Bình", levelName: "A2", score: 82, streak: 9, masteredVocab: 96, todayStatus: "done" },
  { id: "acc_102", fullName: "Lê Chi", levelName: "A2", score: 74, streak: 3, masteredVocab: 71, todayStatus: "in_progress" },
  { id: "acc_103", fullName: "Phạm Dũng", levelName: "A1", score: 95, streak: 21, masteredVocab: 58, todayStatus: "done" },
  { id: "acc_104", fullName: "Hoàng Em", levelName: "A1", score: 40, streak: 0, masteredVocab: 22, todayStatus: "pending" },
  { id: "acc_105", fullName: "Vũ Giang", levelName: "B1", score: 60, streak: 5, masteredVocab: 130, todayStatus: "pending" },
  { id: "acc_106", fullName: "Đỗ Hà", levelName: "A2", score: 88, streak: 15, masteredVocab: 102, todayStatus: "done" },
];

export const vocabToday: Vocabulary[] = [
  {
    id: "vocab_101",
    vocab: "ambitious",
    definition: "having a strong desire to achieve success",
    meanVI: "có tham vọng",
    partOfSpeech: "adjective",
    levelId: "level_2",
    topicId: 4,
  },
  {
    id: "vocab_102",
    vocab: "negotiate",
    definition: "to discuss something to reach an agreement",
    meanVI: "đàm phán",
    partOfSpeech: "verb",
    levelId: "level_2",
    topicId: 5,
  },
  {
    id: "vocab_103",
    vocab: "sustainable",
    definition: "able to continue over a long period without harming the environment",
    meanVI: "bền vững",
    partOfSpeech: "adjective",
    levelId: "level_2",
    topicId: 6,
  },
  {
    id: "vocab_104",
    vocab: "reluctant",
    definition: "unwilling and hesitant",
    meanVI: "miễn cưỡng",
    partOfSpeech: "adjective",
    levelId: "level_2",
    topicId: 4,
  },
];

// ---------- Static practice-content pools ----------
// Seeded as real Question/Answer rows too (see prisma/seed.ts), but there is no admin-CRUD
// screen for them, so the exercise pages keep reading this immutable, code-owned content.

// ---------- Viết câu ----------
export interface SentencePrompt {
  id: string;
  vocab: string;
  meanVI: string;
  exampleSentence: string;
}

export const sentencePrompts: SentencePrompt[] = [
  {
    id: "sw_1",
    vocab: "ambitious",
    meanVI: "có tham vọng",
    exampleSentence: "She is an ambitious student who always aims for the highest score.",
  },
  {
    id: "sw_2",
    vocab: "negotiate",
    meanVI: "đàm phán",
    exampleSentence: "The two companies negotiated a new contract for months.",
  },
  {
    id: "sw_3",
    vocab: "sustainable",
    meanVI: "bền vững",
    exampleSentence: "We should use more sustainable energy sources like solar power.",
  },
  {
    id: "sw_4",
    vocab: "curious",
    meanVI: "tò mò",
    exampleSentence: "The curious child kept asking questions about the stars.",
  },
  {
    id: "sw_5",
    vocab: "colleague",
    meanVI: "đồng nghiệp",
    exampleSentence: "I had lunch with my colleague after the meeting.",
  },
  {
    id: "sw_6",
    vocab: "innovative",
    meanVI: "sáng tạo, đổi mới",
    exampleSentence: "The company is known for its innovative approach to technology.",
  },
];

// ---------- Từ đồng nghĩa - trái nghĩa ----------
export interface SynonymAntonymQuestion {
  id: string;
  word: string;
  meanVI: string;
  relation: "synonym" | "antonym";
  correctAnswer: string;
  options: string[];
}

export const synonymAntonymQuestions: SynonymAntonymQuestion[] = [
  { id: "sa_1", word: "happy", meanVI: "hạnh phúc", relation: "synonym", correctAnswer: "glad", options: ["glad", "sad", "angry", "tired"] },
  { id: "sa_2", word: "big", meanVI: "to lớn", relation: "synonym", correctAnswer: "large", options: ["large", "small", "tiny", "short"] },
  { id: "sa_3", word: "hot", meanVI: "nóng", relation: "antonym", correctAnswer: "cold", options: ["cold", "warm", "boiling", "mild"] },
  { id: "sa_4", word: "easy", meanVI: "dễ", relation: "antonym", correctAnswer: "difficult", options: ["difficult", "simple", "quick", "clear"] },
  { id: "sa_5", word: "fast", meanVI: "nhanh", relation: "synonym", correctAnswer: "quick", options: ["quick", "slow", "lazy", "late"] },
  { id: "sa_6", word: "reluctant", meanVI: "miễn cưỡng", relation: "antonym", correctAnswer: "willing", options: ["willing", "hesitant", "unsure", "shy"] },
  { id: "sa_7", word: "ambitious", meanVI: "có tham vọng", relation: "synonym", correctAnswer: "driven", options: ["driven", "lazy", "careless", "calm"] },
  { id: "sa_8", word: "sustainable", meanVI: "bền vững", relation: "antonym", correctAnswer: "harmful", options: ["harmful", "renewable", "green", "lasting"] },
];

// ---------- Điền từ vào chỗ trống ----------
export interface FillBlankQuestion {
  id: string;
  sentence: string; // contains "___" placeholder
  meanVI: string;
  correctAnswer: string;
  options: string[];
}

export const fillBlankQuestions: FillBlankQuestion[] = [
  { id: "fb_1", sentence: "She is very ___ about learning new languages.", meanVI: "tò mò", correctAnswer: "curious", options: ["curious", "reluctant", "sustainable", "ambitious"] },
  { id: "fb_2", sentence: "The manager had to ___ a better deal with the supplier.", meanVI: "đàm phán", correctAnswer: "negotiate", options: ["negotiate", "postpone", "pollute", "assign"] },
  { id: "fb_3", sentence: "We need to protect the environment from ___.", meanVI: "ô nhiễm", correctAnswer: "pollution", options: ["pollution", "innovation", "algorithm", "itinerary"] },
  { id: "fb_4", sentence: "He was ___ to try the new software at first.", meanVI: "miễn cưỡng", correctAnswer: "reluctant", options: ["reluctant", "curious", "meticulous", "innovative"] },
  { id: "fb_5", sentence: "My ___ helped me finish the project on time.", meanVI: "đồng nghiệp", correctAnswer: "colleague", options: ["colleague", "itinerary", "hypothesis", "pollution"] },
  { id: "fb_6", sentence: "The scientist tested her ___ with an experiment.", meanVI: "giả thuyết", correctAnswer: "hypothesis", options: ["hypothesis", "algorithm", "itinerary", "colleague"] },
];

// ---------- Từ ghép ----------
export interface WordFormationPrompt {
  id: string;
  word: string;
  meanVI: string;
  definition: string;
}

export const wordFormationPrompts: WordFormationPrompt[] = [
  { id: "wf_1", word: "sustainable", meanVI: "bền vững", definition: "able to continue over a long period without harming the environment" },
  { id: "wf_2", word: "ambitious", meanVI: "có tham vọng", definition: "having a strong desire to achieve success" },
  { id: "wf_3", word: "innovative", meanVI: "sáng tạo, đổi mới", definition: "introducing new ideas or methods" },
  { id: "wf_4", word: "meticulous", meanVI: "tỉ mỉ, cẩn thận", definition: "showing great attention to detail" },
  { id: "wf_5", word: "algorithm", meanVI: "thuật toán", definition: "a set of rules for solving a problem" },
];
