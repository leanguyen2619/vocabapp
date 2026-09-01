-- AlterEnum
ALTER TYPE "PracticeTypeCode" ADD VALUE 'reading_comprehension';

-- CreateTable
CREATE TABLE "ReadingPassage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingPassage_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "passageId" TEXT,
ADD COLUMN "blankNumber" INTEGER;

-- CreateIndex
CREATE INDEX "ReadingPassage_levelId_status_idx" ON "ReadingPassage"("levelId", "status");

-- CreateIndex
CREATE INDEX "Question_passageId_idx" ON "Question"("passageId");

-- AddForeignKey
ALTER TABLE "ReadingPassage" ADD CONSTRAINT "ReadingPassage_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingPassage" ADD CONSTRAINT "ReadingPassage_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "ReadingPassage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
