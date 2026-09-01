/**
 * Domain types mirrored 1:1 from the DB schema (ERD).
 * Table -> Type mapping is kept explicit so the API layer can be swapped
 * from mock data to real endpoints without touching UI code.
 */

export type Role = "student" | "admin";
export type AccountStatus = "active" | "inactive";

// ---------- Accounts ----------
export interface Account {
  id_login: string; // PK, IQ_Login
  fullName: string;
  role: Role;
  status: AccountStatus;
  classId: string | null; // FK -> Classes.id
  avatarUrl: string | null;
}

// ---------- Classes ----------
export interface SchoolClass {
  id: string; // PK
  className: string;
  dailyWordTarget: number;
}

// ---------- Levels ----------
export interface Level {
  id: string; // PK
  level: string; // e.g. "Beginner", "A1", "Level 1"
  maxScore: number;
  // Optional auto-unlock threshold (% mastery of THIS level) — see the Level model comment in
  // schema.prisma. Null means no auto-unlock.
  autoUnlockNextAt: number | null;
}

// ---------- Accounts_Level ----------
export type AccountLevelStatus = "locked" | "in_progress" | "completed";

export interface AccountLevel {
  accountId: string; // PK, FK -> Account
  levelId: string; // PK, FK -> Level
  score: number;
  streak: number;
  manualNote?: string;
  status: AccountLevelStatus;
}

// ---------- Topics ----------
export interface Topic {
  id: number; // PK, id_topic
  topic: string;
  definition: string;
}

// ---------- Vocabulations ----------
export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "pronoun"
  | "conjunction"
  | "interjection";

export interface Vocabulary {
  id: string; // PK
  vocab: string;
  definition: string;
  meanVI: string;
  partOfSpeech: PartOfSpeech;
  ipa: string | null;
  levelId: string; // FK -> Level
  topicId: number; // FK -> Topic
}

// ---------- Word_Relations ----------
export type WordRelationType = "synonym" | "antonym" | "related";

export interface WordRelation {
  mainId: string; // PK, FK -> Vocabulary
  subId: string; // PK, FK -> Vocabulary
  relationship: WordRelationType;
}

// ---------- PracType ----------
export type PracticeTypeCode =
  | "multiple_choice"
  | "flashcard"
  | "typing"
  | "listening"
  | "matching"
  | "pos_classification"
  | "sentence_writing"
  | "synonym_antonym"
  | "fill_blank"
  | "word_formation"
  | "listening_comprehension"
  | "reading_comprehension"
  | "word_transformation";

export interface PracticeType {
  id: string; // PK
  levelId: string; // FK -> Level
  type: PracticeTypeCode;
  definition: string;
  name: string;
  description: string;
  enabled: boolean;
}

// ---------- QuestionBank ----------
export type QuestionStatus = "pending" | "approved" | "rejected";

export interface Question {
  id: string; // PK
  vocabId: string; // FK -> Vocabulary
  pracTypeId: string; // FK -> PracticeType
  questionText: string;
  explanation?: string;
  status: QuestionStatus;
}

// ---------- AnswersBank ----------
export interface Answer {
  questionId: string; // PK, FK -> Question
  ansId: string; // PK
  ansText: string;
  status: "active" | "disabled";
  isCorrect: boolean;
}

// ---------- Exercise_Attempts ----------
export interface ExerciseAttempt {
  id: string; // PK
  accountId: string; // FK -> Account
  vocabId: string; // FK -> Vocabulary
  questionId: string; // FK -> Question
  pracTypeId: string; // FK -> PracticeType
  answerId: string; // FK -> Answer
  timeSpentMs: number;
  attemptedAt: string; // ISO date
  isCorrect: boolean;
}

// ---------- Learning_History ----------
export type LearningStatus = "new" | "learning" | "mastered";

export interface LearningHistory {
  accountId: string; // PK, FK
  vocabId: string; // PK, FK
  lastDate: string; // ISO date
  status: LearningStatus;
}

// ---------- Daily_Assignments ----------
export type AssignmentStatus = "pending" | "in_progress" | "done" | "overdue";

export interface DailyAssignment {
  assignmentId: string; // PK
  accountId: string; // FK
  vocabId: string; // FK
  assignedDate: string; // ISO date
  status: AssignmentStatus;
}

// ---------- Composed / view-model types used by the UI ----------

export interface VocabularyWithProgress extends Vocabulary {
  learningStatus: LearningStatus;
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
  vocab: Vocabulary;
}

export interface LevelWithProgress extends Level {
  score: number;
  streak: number;
  status: AccountLevelStatus;
  totalVocab: number;
  masteredVocab: number;
}

export interface DailyAssignmentWithVocab extends DailyAssignment {
  vocab: Vocabulary;
}

export interface QuizResult {
  pracTypeId: string;
  levelId: string;
  totalQuestions: number;
  correctCount: number;
  timeSpentMs: number;
  attempts: ExerciseAttempt[];
}
