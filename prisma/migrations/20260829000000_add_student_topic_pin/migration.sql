-- AlterTable
ALTER TABLE "Account" ADD COLUMN "pinnedTopicId" INTEGER,
ADD COLUMN "dailyWordTargetOverride" INTEGER;

-- CreateIndex
CREATE INDEX "Account_pinnedTopicId_idx" ON "Account"("pinnedTopicId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_pinnedTopicId_fkey" FOREIGN KEY ("pinnedTopicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
