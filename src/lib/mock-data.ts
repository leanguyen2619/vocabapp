import type {
  Account,
  AccountLevel,
  AccountLevelStatus,
  Answer,
  AssignmentStatus,
  DailyAssignmentWithVocab,
  LevelWithProgress,
  QuestionStatus,
  QuestionWithAnswers,
  SchoolClass,
  Topic,
  Vocabulary,
  VocabularyWithProgress,
} from "@/types";

export const topics: Topic[] = [
  { id: 1, topic: "Daily Life", definition: "Từ vựng về các hoạt động và tình huống thường ngày." },
  { id: 2, topic: "Family", definition: "Từ vựng về gia đình và các mối quan hệ thân thiết." },
  { id: 3, topic: "Food", definition: "Từ vựng về đồ ăn, thức uống và ẩm thực." },
  { id: 4, topic: "Personality", definition: "Từ vựng mô tả tính cách và đặc điểm con người." },
  { id: 5, topic: "Business", definition: "Từ vựng về công việc, kinh doanh và môi trường công sở." },
  { id: 6, topic: "Environment", definition: "Từ vựng về môi trường và các vấn đề sinh thái." },
  { id: 7, topic: "Technology", definition: "Từ vựng về công nghệ và khoa học kỹ thuật." },
  { id: 8, topic: "Travel", definition: "Từ vựng về du lịch và di chuyển." },
  { id: 9, topic: "Academic", definition: "Từ vựng học thuật dùng trong nghiên cứu và học tập." },
];

export function getTopicName(topicId: number): string {
  return topics.find((t) => t.id === topicId)?.topic ?? String(topicId);
}

export const currentAccount: Account = {
  id_login: "acc_001",
  fullName: "Nguyễn An",
  role: "student",
  status: "active",
  classId: "class_10a1",
};

export const schoolClasses: SchoolClass[] = [
  { id: "class_10a1", className: "Lớp 10A1", dailyWordTarget: 5 },
];

export function getClassName(classId: string | null): string | null {
  return schoolClasses.find((c) => c.id === classId)?.className ?? null;
}

/** In-memory only — demo admin data has no real backend, resets on page reload. */
export function createClass(className: string, dailyWordTarget: number): SchoolClass {
  const newClass: SchoolClass = { id: `class_${Date.now()}`, className, dailyWordTarget };
  schoolClasses.push(newClass);
  return newClass;
}

export function updateClass(
  id: string,
  patch: Partial<Pick<SchoolClass, "className" | "dailyWordTarget">>
): SchoolClass | null {
  const cls = schoolClasses.find((c) => c.id === id);
  if (!cls) return null;
  Object.assign(cls, patch);
  return cls;
}

export const DEMO_CREDENTIALS = { email: "an@vocabapp.vn", password: "123456" };
export const ADMIN_DEMO_CREDENTIALS = { email: "admin@vocabapp.vn", password: "admin123" };

const adminAccount: Account = {
  id_login: "acc_admin",
  fullName: "Quản trị viên",
  role: "admin",
  status: "active",
  classId: null,
};

interface MockUser {
  email: string;
  password: string;
  account: Account;
}

/** In-memory only — demo auth has no real backend, resets on page reload. */
export const mockUsers: MockUser[] = [
  { email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password, account: currentAccount },
  { email: ADMIN_DEMO_CREDENTIALS.email, password: ADMIN_DEMO_CREDENTIALS.password, account: adminAccount },
];

export const levels: LevelWithProgress[] = [
  {
    id: "level_1",
    level: "A1",
    maxScore: 100,
    score: 100,
    streak: 12,
    status: "completed",
    totalVocab: 60,
    masteredVocab: 60,
  },
  {
    id: "level_2",
    level: "A2",
    maxScore: 100,
    score: 68,
    streak: 12,
    status: "in_progress",
    totalVocab: 80,
    masteredVocab: 54,
  },
  {
    id: "level_3",
    level: "B1",
    maxScore: 100,
    score: 0,
    streak: 0,
    status: "locked",
    totalVocab: 100,
    masteredVocab: 0,
  },
  {
    id: "level_4",
    level: "B2",
    maxScore: 100,
    score: 0,
    streak: 0,
    status: "locked",
    totalVocab: 0,
    masteredVocab: 0,
  },
];

export function getLevelName(levelId: string): string {
  return levels.find((l) => l.id === levelId)?.level ?? levelId;
}

/** Per-student level unlock status — admin can override manually. In-memory only. */
export const accountLevels: AccountLevel[] = [
  { accountId: "acc_001", levelId: "level_1", score: 100, streak: 12, status: "completed" },
  { accountId: "acc_001", levelId: "level_2", score: 68, streak: 12, status: "in_progress" },
  { accountId: "acc_001", levelId: "level_3", score: 0, streak: 0, status: "locked" },
  { accountId: "acc_001", levelId: "level_4", score: 0, streak: 0, status: "locked" },
];

export function getAccountLevelStatus(accountId: string, levelId: string): AccountLevelStatus {
  return (
    accountLevels.find((e) => e.accountId === accountId && e.levelId === levelId)?.status ?? "locked"
  );
}

export function setAccountLevelStatus(
  accountId: string,
  levelId: string,
  status: AccountLevelStatus,
  manualNote?: string
) {
  const entry = accountLevels.find((e) => e.accountId === accountId && e.levelId === levelId);
  if (entry) {
    entry.status = status;
    entry.manualNote = manualNote || entry.manualNote;
  } else {
    accountLevels.push({ accountId, levelId, score: 0, streak: 0, status, manualNote });
  }
}

export const vocabularyBank: VocabularyWithProgress[] = [
  // A1 — level_1
  { id: "vocab_001", vocab: "happy", definition: "feeling or showing pleasure", meanVI: "hạnh phúc", partOfSpeech: "adjective", levelId: "level_1", topicId: 1, learningStatus: "mastered" },
  { id: "vocab_002", vocab: "friend", definition: "a person you know and like", meanVI: "bạn bè", partOfSpeech: "noun", levelId: "level_1", topicId: 2, learningStatus: "mastered" },
  { id: "vocab_003", vocab: "eat", definition: "to put food in your mouth and swallow it", meanVI: "ăn", partOfSpeech: "verb", levelId: "level_1", topicId: 3, learningStatus: "mastered" },
  { id: "vocab_004", vocab: "house", definition: "a building where people live", meanVI: "ngôi nhà", partOfSpeech: "noun", levelId: "level_1", topicId: 1, learningStatus: "mastered" },
  { id: "vocab_005", vocab: "quickly", definition: "at a fast speed", meanVI: "nhanh chóng", partOfSpeech: "adverb", levelId: "level_1", topicId: 1, learningStatus: "mastered" },

  // A2 — level_2
  { id: "vocab_101", vocab: "ambitious", definition: "having a strong desire to achieve success", meanVI: "có tham vọng", partOfSpeech: "adjective", levelId: "level_2", topicId: 4, learningStatus: "mastered" },
  { id: "vocab_102", vocab: "negotiate", definition: "to discuss something to reach an agreement", meanVI: "đàm phán", partOfSpeech: "verb", levelId: "level_2", topicId: 5, learningStatus: "learning" },
  { id: "vocab_103", vocab: "sustainable", definition: "able to continue over a long period without harming the environment", meanVI: "bền vững", partOfSpeech: "adjective", levelId: "level_2", topicId: 6, learningStatus: "learning" },
  { id: "vocab_104", vocab: "reluctant", definition: "unwilling and hesitant", meanVI: "miễn cưỡng", partOfSpeech: "adjective", levelId: "level_2", topicId: 4, learningStatus: "mastered" },
  { id: "vocab_105", vocab: "colleague", definition: "a person you work with", meanVI: "đồng nghiệp", partOfSpeech: "noun", levelId: "level_2", topicId: 5, learningStatus: "learning" },
  { id: "vocab_106", vocab: "curious", definition: "eager to know or learn something", meanVI: "tò mò", partOfSpeech: "adjective", levelId: "level_2", topicId: 4, learningStatus: "new" },
  { id: "vocab_107", vocab: "pollution", definition: "harmful substances damaging the environment", meanVI: "ô nhiễm", partOfSpeech: "noun", levelId: "level_2", topicId: 6, learningStatus: "new" },

  // B1 — level_3
  { id: "vocab_201", vocab: "algorithm", definition: "a set of rules for solving a problem", meanVI: "thuật toán", partOfSpeech: "noun", levelId: "level_3", topicId: 7, learningStatus: "new" },
  { id: "vocab_202", vocab: "itinerary", definition: "a planned route or schedule of a journey", meanVI: "lịch trình", partOfSpeech: "noun", levelId: "level_3", topicId: 8, learningStatus: "new" },
  { id: "vocab_203", vocab: "hypothesis", definition: "an idea that is suggested as an explanation", meanVI: "giả thuyết", partOfSpeech: "noun", levelId: "level_3", topicId: 9, learningStatus: "new" },
  { id: "vocab_204", vocab: "innovative", definition: "introducing new ideas or methods", meanVI: "sáng tạo, đổi mới", partOfSpeech: "adjective", levelId: "level_3", topicId: 7, learningStatus: "new" },
  { id: "vocab_205", vocab: "postpone", definition: "to delay an event to a later time", meanVI: "hoãn lại", partOfSpeech: "verb", levelId: "level_3", topicId: 8, learningStatus: "new" },
  { id: "vocab_206", vocab: "meticulous", definition: "showing great attention to detail", meanVI: "tỉ mỉ, cẩn thận", partOfSpeech: "adjective", levelId: "level_3", topicId: 9, learningStatus: "new" },
];

/** In-memory only — demo admin data has no real backend, resets on page reload. */
export function createVocabulary(
  input: Omit<VocabularyWithProgress, "id" | "learningStatus">
): VocabularyWithProgress {
  const word: VocabularyWithProgress = {
    ...input,
    id: `vocab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    learningStatus: "new",
  };
  vocabularyBank.push(word);
  return word;
}

export function updateVocabulary(
  id: string,
  patch: Partial<Omit<Vocabulary, "id">>
): VocabularyWithProgress | null {
  const word = vocabularyBank.find((w) => w.id === id);
  if (!word) return null;
  Object.assign(word, patch);
  return word;
}

export function deleteVocabulary(id: string) {
  const index = vocabularyBank.findIndex((w) => w.id === id);
  if (index !== -1) vocabularyBank.splice(index, 1);
}

export function bulkCreateVocabulary(rows: Omit<VocabularyWithProgress, "id" | "learningStatus">[]): number {
  rows.forEach((row, i) => {
    vocabularyBank.push({
      ...row,
      id: `vocab_import_${Date.now()}_${i}`,
      learningStatus: "new",
    });
  });
  return rows.length;
}

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

// ---------- Question Bank ----------
function findVocab(id: string): Vocabulary {
  const vocab = vocabularyBank.find((v) => v.id === id);
  if (!vocab) throw new Error(`Unknown vocab id: ${id}`);
  return vocab;
}

function buildAnswers(questionId: string, answers: { ansText: string; isCorrect: boolean }[]): Answer[] {
  return answers.map((a, i) => ({
    questionId,
    ansId: `${questionId}_a${i}`,
    ansText: a.ansText,
    status: "active",
    isCorrect: a.isCorrect,
  }));
}

function buildQuestion(
  id: string,
  vocabId: string,
  questionText: string,
  answers: { ansText: string; isCorrect: boolean }[],
  status: QuestionStatus
): QuestionWithAnswers {
  return {
    id,
    vocabId,
    pracTypeId: "multiple_choice",
    questionText,
    status,
    answers: buildAnswers(id, answers),
    vocab: findVocab(vocabId),
  };
}

export const questionBank: QuestionWithAnswers[] = [
  buildQuestion("q_1", "vocab_101", 'Từ nào có nghĩa là "có tham vọng"?', [
    { ansText: "ambitious", isCorrect: true },
    { ansText: "negotiate", isCorrect: false },
    { ansText: "sustainable", isCorrect: false },
    { ansText: "reluctant", isCorrect: false },
  ], "approved"),
  buildQuestion("q_2", "vocab_102", 'Từ nào có nghĩa là "đàm phán"?', [
    { ansText: "negotiate", isCorrect: true },
    { ansText: "colleague", isCorrect: false },
    { ansText: "curious", isCorrect: false },
    { ansText: "pollution", isCorrect: false },
  ], "approved"),
  buildQuestion("q_3", "vocab_103", 'Từ nào có nghĩa là "bền vững"?', [
    { ansText: "sustainable", isCorrect: true },
    { ansText: "reluctant", isCorrect: false },
    { ansText: "ambitious", isCorrect: false },
    { ansText: "negotiate", isCorrect: false },
  ], "pending"),
  buildQuestion("q_4", "vocab_201", 'Từ nào có nghĩa là "thuật toán"?', [
    { ansText: "algorithm", isCorrect: true },
    { ansText: "itinerary", isCorrect: false },
    { ansText: "hypothesis", isCorrect: false },
    { ansText: "innovative", isCorrect: false },
  ], "approved"),
  buildQuestion("q_5", "vocab_202", 'Từ nào có nghĩa là "lịch trình"?', [
    { ansText: "itinerary", isCorrect: true },
    { ansText: "postpone", isCorrect: false },
    { ansText: "meticulous", isCorrect: false },
    { ansText: "algorithm", isCorrect: false },
  ], "pending"),
  buildQuestion("q_6", "vocab_001", 'Từ nào có nghĩa là "hạnh phúc"?', [
    { ansText: "happy", isCorrect: true },
    { ansText: "friend", isCorrect: false },
    { ansText: "eat", isCorrect: false },
    { ansText: "house", isCorrect: false },
  ], "approved"),
  buildQuestion("q_7", "vocab_106", 'Từ nào có nghĩa là "tò mò"?', [
    { ansText: "curious", isCorrect: true },
    { ansText: "pollution", isCorrect: false },
    { ansText: "colleague", isCorrect: false },
    { ansText: "negotiate", isCorrect: false },
  ], "pending"),
  buildQuestion("q_8", "vocab_206", 'Từ nào có nghĩa là "tỉ mỉ, cẩn thận"?', [
    { ansText: "meticulous", isCorrect: true },
    { ansText: "hypothesis", isCorrect: false },
    { ansText: "postpone", isCorrect: false },
    { ansText: "innovative", isCorrect: false },
  ], "rejected"),
];

/** In-memory only — demo admin data has no real backend, resets on page reload. */
export function createQuestion(input: {
  vocabId: string;
  questionText: string;
  explanation?: string;
  answers: { ansText: string; isCorrect: boolean }[];
}): QuestionWithAnswers {
  const id = `q_${Date.now()}`;
  const question: QuestionWithAnswers = {
    id,
    vocabId: input.vocabId,
    pracTypeId: "multiple_choice",
    questionText: input.questionText,
    explanation: input.explanation,
    status: "pending",
    answers: buildAnswers(id, input.answers),
    vocab: findVocab(input.vocabId),
  };
  questionBank.push(question);
  return question;
}

export function updateQuestion(
  id: string,
  patch: {
    vocabId?: string;
    questionText?: string;
    explanation?: string;
    answers?: { ansText: string; isCorrect: boolean }[];
  }
): QuestionWithAnswers | null {
  const question = questionBank.find((q) => q.id === id);
  if (!question) return null;
  if (patch.questionText !== undefined) question.questionText = patch.questionText;
  if (patch.explanation !== undefined) question.explanation = patch.explanation;
  if (patch.vocabId !== undefined) {
    question.vocabId = patch.vocabId;
    question.vocab = findVocab(patch.vocabId);
  }
  if (patch.answers) {
    question.answers = buildAnswers(id, patch.answers);
  }
  return question;
}

export function setQuestionStatus(id: string, status: QuestionStatus): QuestionWithAnswers | null {
  const question = questionBank.find((q) => q.id === id);
  if (!question) return null;
  question.status = status;
  return question;
}
