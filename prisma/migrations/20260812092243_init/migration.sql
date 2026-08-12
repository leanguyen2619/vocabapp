-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'teacher', 'admin');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'inactive', 'banned');

-- CreateEnum
CREATE TYPE "AccountLevelStatus" AS ENUM ('locked', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "PartOfSpeech" AS ENUM ('noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun', 'conjunction', 'interjection');

-- CreateEnum
CREATE TYPE "WordRelationType" AS ENUM ('synonym', 'antonym', 'related');

-- CreateEnum
CREATE TYPE "PracticeTypeCode" AS ENUM ('multiple_choice', 'flashcard', 'typing', 'listening', 'matching', 'pos_classification', 'sentence_writing', 'synonym_antonym', 'fill_blank', 'word_formation');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "AnswerStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "LearningStatus" AS ENUM ('new', 'learning', 'mastered');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('pending', 'in_progress', 'done', 'overdue');

-- CreateTable
CREATE TABLE "Account" (
    "id_login" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'active',
    "classId" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id_login")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "dailyWordTarget" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "Level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountLevel" (
    "accountId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "manualNote" TEXT,
    "status" "AccountLevelStatus" NOT NULL DEFAULT 'locked',

    CONSTRAINT "AccountLevel_pkey" PRIMARY KEY ("accountId","levelId")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "definition" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "vocab" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "meanVI" TEXT NOT NULL,
    "partOfSpeech" "PartOfSpeech" NOT NULL,
    "levelId" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordRelation" (
    "mainId" TEXT NOT NULL,
    "subId" TEXT NOT NULL,
    "relationship" "WordRelationType" NOT NULL,

    CONSTRAINT "WordRelation_pkey" PRIMARY KEY ("mainId","subId")
);

-- CreateTable
CREATE TABLE "PracticeType" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "type" "PracticeTypeCode" NOT NULL,
    "definition" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PracticeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "pracTypeId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "explanation" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "ansId" TEXT NOT NULL,
    "ansText" TEXT NOT NULL,
    "status" "AnswerStatus" NOT NULL DEFAULT 'active',
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "pracTypeId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "timeSpentMs" INTEGER NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "ExerciseAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningHistory" (
    "accountId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "lastDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "LearningStatus" NOT NULL DEFAULT 'new',

    CONSTRAINT "LearningHistory_pkey" PRIMARY KEY ("accountId","vocabId")
);

-- CreateTable
CREATE TABLE "DailyAssignment" (
    "assignmentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "DailyAssignment_pkey" PRIMARY KEY ("assignmentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "Session_accountId_idx" ON "Session"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeType_type_key" ON "PracticeType"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_questionId_ansId_key" ON "Answer"("questionId", "ansId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountLevel" ADD CONSTRAINT "AccountLevel_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountLevel" ADD CONSTRAINT "AccountLevel_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordRelation" ADD CONSTRAINT "WordRelation_mainId_fkey" FOREIGN KEY ("mainId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordRelation" ADD CONSTRAINT "WordRelation_subId_fkey" FOREIGN KEY ("subId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeType" ADD CONSTRAINT "PracticeType_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_pracTypeId_fkey" FOREIGN KEY ("pracTypeId") REFERENCES "PracticeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_pracTypeId_fkey" FOREIGN KEY ("pracTypeId") REFERENCES "PracticeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseAttempt" ADD CONSTRAINT "ExerciseAttempt_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningHistory" ADD CONSTRAINT "LearningHistory_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningHistory" ADD CONSTRAINT "LearningHistory_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAssignment" ADD CONSTRAINT "DailyAssignment_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyAssignment" ADD CONSTRAINT "DailyAssignment_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
