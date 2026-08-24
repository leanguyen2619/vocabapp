-- CreateTable
CREATE TABLE "DailyWordPick" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "vocabId" TEXT NOT NULL,
    "pickedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyWordPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyWordPick_accountId_vocabId_pickedDate_key" ON "DailyWordPick"("accountId", "vocabId", "pickedDate");

-- AddForeignKey
ALTER TABLE "DailyWordPick" ADD CONSTRAINT "DailyWordPick_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyWordPick" ADD CONSTRAINT "DailyWordPick_vocabId_fkey" FOREIGN KEY ("vocabId") REFERENCES "Vocabulary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
