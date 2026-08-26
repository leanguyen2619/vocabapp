-- CreateIndex
CREATE INDEX "Account_classId_idx" ON "Account"("classId");

-- CreateIndex
CREATE INDEX "Account_role_idx" ON "Account"("role");

-- CreateIndex
CREATE INDEX "Question_pracTypeId_status_idx" ON "Question"("pracTypeId", "status");

-- CreateIndex
CREATE INDEX "Question_vocabId_idx" ON "Question"("vocabId");

-- CreateIndex
CREATE INDEX "Vocabulary_levelId_idx" ON "Vocabulary"("levelId");
