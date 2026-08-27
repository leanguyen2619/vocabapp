-- CreateEnum
CREATE TYPE "WritingSubmissionStatus" AS ENUM ('pending', 'graded');

-- CreateTable
CREATE TABLE "WritingSubmission" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "status" "WritingSubmissionStatus" NOT NULL DEFAULT 'pending',
    "score" INTEGER,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,

    CONSTRAINT "WritingSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WritingSubmission_accountId_status_idx" ON "WritingSubmission"("accountId", "status");

-- CreateIndex
CREATE INDEX "WritingSubmission_status_idx" ON "WritingSubmission"("status");

-- AddForeignKey
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingSubmission" ADD CONSTRAINT "WritingSubmission_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
