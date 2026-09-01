-- AlterEnum
ALTER TYPE "PracticeTypeCode" ADD VALUE 'reading_practice';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "readingTextId" TEXT;

-- CreateTable
CREATE TABLE "ReadingText" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "status" "QuestionStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingText_levelId_status_idx" ON "ReadingText"("levelId", "status");

-- CreateIndex
CREATE INDEX "Question_readingTextId_idx" ON "Question"("readingTextId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_readingTextId_fkey" FOREIGN KEY ("readingTextId") REFERENCES "ReadingText"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingText" ADD CONSTRAINT "ReadingText_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingText" ADD CONSTRAINT "ReadingText_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
