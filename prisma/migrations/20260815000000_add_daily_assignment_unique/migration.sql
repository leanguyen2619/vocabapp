-- CreateIndex
CREATE UNIQUE INDEX "DailyAssignment_accountId_vocabId_assignedDate_key" ON "DailyAssignment"("accountId", "vocabId", "assignedDate");
