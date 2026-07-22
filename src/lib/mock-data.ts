import type {
  Account,
  AssignmentStatus,
  DailyAssignmentWithVocab,
  LevelWithProgress,
  SchoolClass,
  Vocabulary,
  VocabularyWithProgress,
} from "@/types";

export const currentAccount: Account = {
  id_login: "acc_001",
  fullName: "Nguyễn An",
  role: "student",
  status: "active",
  classId: "class_10a1",
};

export const schoolClasses: SchoolClass[] = [{ id: "class_10a1", className: "Lớp 10A1" }];

export function getClassName(classId: string | null): string | null {
  return schoolClasses.find((c) => c.id === classId)?.className ?? null;
}

export const DEMO_CREDENTIALS = { email: "an@vocabapp.vn", password: "123456" };

interface MockUser {
  email: string;
  password: string;
  account: Account;
}

/** In-memory only — demo auth has no real backend, resets on page reload. */
export const mockUsers: MockUser[] = [
  { email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password, account: currentAccount },
];

export const levels: LevelWithProgress[] = [
  {
    id: "level_1",
    level: "Beginner",
    maxScore: 100,
    score: 100,
    streak: 12,
    status: "completed",
    totalVocab: 60,
    masteredVocab: 60,
  },
  {
    id: "level_2",
    level: "Elementary",
    maxScore: 100,
    score: 68,
    streak: 12,
    status: "in_progress",
    totalVocab: 80,
    masteredVocab: 54,
  },
  {
    id: "level_3",
    level: "Intermediate",
    maxScore: 100,
    score: 0,
    streak: 0,
    status: "locked",
    totalVocab: 100,
    masteredVocab: 0,
  },
];

export function getLevelName(levelId: string): string {
  return levels.find((l) => l.id === levelId)?.level ?? levelId;
}

export const vocabularyBank: VocabularyWithProgress[] = [
  // Beginner — level_1
  { id: "vocab_001", vocab: "happy", definition: "feeling or showing pleasure", meanVI: "hạnh phúc", partOfSpeech: "adjective", levelId: "level_1", topic: "Daily Life", learningStatus: "mastered" },
  { id: "vocab_002", vocab: "friend", definition: "a person you know and like", meanVI: "bạn bè", partOfSpeech: "noun", levelId: "level_1", topic: "Family", learningStatus: "mastered" },
  { id: "vocab_003", vocab: "eat", definition: "to put food in your mouth and swallow it", meanVI: "ăn", partOfSpeech: "verb", levelId: "level_1", topic: "Food", learningStatus: "mastered" },
  { id: "vocab_004", vocab: "house", definition: "a building where people live", meanVI: "ngôi nhà", partOfSpeech: "noun", levelId: "level_1", topic: "Daily Life", learningStatus: "mastered" },
  { id: "vocab_005", vocab: "quickly", definition: "at a fast speed", meanVI: "nhanh chóng", partOfSpeech: "adverb", levelId: "level_1", topic: "Daily Life", learningStatus: "mastered" },

  // Elementary — level_2
  { id: "vocab_101", vocab: "ambitious", definition: "having a strong desire to achieve success", meanVI: "có tham vọng", partOfSpeech: "adjective", levelId: "level_2", topic: "Personality", learningStatus: "mastered" },
  { id: "vocab_102", vocab: "negotiate", definition: "to discuss something to reach an agreement", meanVI: "đàm phán", partOfSpeech: "verb", levelId: "level_2", topic: "Business", learningStatus: "learning" },
  { id: "vocab_103", vocab: "sustainable", definition: "able to continue over a long period without harming the environment", meanVI: "bền vững", partOfSpeech: "adjective", levelId: "level_2", topic: "Environment", learningStatus: "learning" },
  { id: "vocab_104", vocab: "reluctant", definition: "unwilling and hesitant", meanVI: "miễn cưỡng", partOfSpeech: "adjective", levelId: "level_2", topic: "Personality", learningStatus: "mastered" },
  { id: "vocab_105", vocab: "colleague", definition: "a person you work with", meanVI: "đồng nghiệp", partOfSpeech: "noun", levelId: "level_2", topic: "Business", learningStatus: "learning" },
  { id: "vocab_106", vocab: "curious", definition: "eager to know or learn something", meanVI: "tò mò", partOfSpeech: "adjective", levelId: "level_2", topic: "Personality", learningStatus: "new" },
  { id: "vocab_107", vocab: "pollution", definition: "harmful substances damaging the environment", meanVI: "ô nhiễm", partOfSpeech: "noun", levelId: "level_2", topic: "Environment", learningStatus: "new" },

  // Intermediate — level_3
  { id: "vocab_201", vocab: "algorithm", definition: "a set of rules for solving a problem", meanVI: "thuật toán", partOfSpeech: "noun", levelId: "level_3", topic: "Technology", learningStatus: "new" },
  { id: "vocab_202", vocab: "itinerary", definition: "a planned route or schedule of a journey", meanVI: "lịch trình", partOfSpeech: "noun", levelId: "level_3", topic: "Travel", learningStatus: "new" },
  { id: "vocab_203", vocab: "hypothesis", definition: "an idea that is suggested as an explanation", meanVI: "giả thuyết", partOfSpeech: "noun", levelId: "level_3", topic: "Academic", learningStatus: "new" },
  { id: "vocab_204", vocab: "innovative", definition: "introducing new ideas or methods", meanVI: "sáng tạo, đổi mới", partOfSpeech: "adjective", levelId: "level_3", topic: "Technology", learningStatus: "new" },
  { id: "vocab_205", vocab: "postpone", definition: "to delay an event to a later time", meanVI: "hoãn lại", partOfSpeech: "verb", levelId: "level_3", topic: "Travel", learningStatus: "new" },
  { id: "vocab_206", vocab: "meticulous", definition: "showing great attention to detail", meanVI: "tỉ mỉ, cẩn thận", partOfSpeech: "adjective", levelId: "level_3", topic: "Academic", learningStatus: "new" },
];

export const vocabToday: Vocabulary[] = [
  {
    id: "vocab_101",
    vocab: "ambitious",
    definition: "having a strong desire to achieve success",
    meanVI: "có tham vọng",
    partOfSpeech: "adjective",
    levelId: "level_2",
    topic: "Personality",
  },
  {
    id: "vocab_102",
    vocab: "negotiate",
    definition: "to discuss something to reach an agreement",
    meanVI: "đàm phán",
    partOfSpeech: "verb",
    levelId: "level_2",
    topic: "Business",
  },
  {
    id: "vocab_103",
    vocab: "sustainable",
    definition: "able to continue over a long period without harming the environment",
    meanVI: "bền vững",
    partOfSpeech: "adjective",
    levelId: "level_2",
    topic: "Environment",
  },
  {
    id: "vocab_104",
    vocab: "reluctant",
    definition: "unwilling and hesitant",
    meanVI: "miễn cưỡng",
    partOfSpeech: "adjective",
    levelId: "level_2",
    topic: "Personality",
  },
];

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
  { id: "acc_101", fullName: "Trần Bình", levelName: "Elementary", score: 82, streak: 9, masteredVocab: 96, todayStatus: "done" },
  { id: "acc_102", fullName: "Lê Chi", levelName: "Elementary", score: 74, streak: 3, masteredVocab: 71, todayStatus: "in_progress" },
  { id: "acc_103", fullName: "Phạm Dũng", levelName: "Beginner", score: 95, streak: 21, masteredVocab: 58, todayStatus: "done" },
  { id: "acc_104", fullName: "Hoàng Em", levelName: "Beginner", score: 40, streak: 0, masteredVocab: 22, todayStatus: "pending" },
  { id: "acc_105", fullName: "Vũ Giang", levelName: "Intermediate", score: 60, streak: 5, masteredVocab: 130, todayStatus: "pending" },
  { id: "acc_106", fullName: "Đỗ Hà", levelName: "Elementary", score: 88, streak: 15, masteredVocab: 102, todayStatus: "done" },
];

export const dailyAssignments: DailyAssignmentWithVocab[] = [
  {
    assignmentId: "assign_1",
    accountId: currentAccount.id_login,
    vocabId: vocabToday[0].id,
    assignedDate: "2026-07-21",
    status: "done",
    vocab: vocabToday[0],
  },
  {
    assignmentId: "assign_2",
    accountId: currentAccount.id_login,
    vocabId: vocabToday[1].id,
    assignedDate: "2026-07-21",
    status: "in_progress",
    vocab: vocabToday[1],
  },
  {
    assignmentId: "assign_3",
    accountId: currentAccount.id_login,
    vocabId: vocabToday[2].id,
    assignedDate: "2026-07-21",
    status: "pending",
    vocab: vocabToday[2],
  },
  {
    assignmentId: "assign_4",
    accountId: currentAccount.id_login,
    vocabId: vocabToday[3].id,
    assignedDate: "2026-07-21",
    status: "pending",
    vocab: vocabToday[3],
  },
];
