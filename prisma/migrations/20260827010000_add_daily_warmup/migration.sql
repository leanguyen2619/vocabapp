-- CreateTable
CREATE TABLE "DailyWarmup" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "warmupDate" TIMESTAMP(3) NOT NULL,
    "practiceTypeCodes" "PracticeTypeCode"[],
    "completedCodes" "PracticeTypeCode"[],

    CONSTRAINT "DailyWarmup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyWarmup_accountId_warmupDate_key" ON "DailyWarmup"("accountId", "warmupDate");

-- AddForeignKey
ALTER TABLE "DailyWarmup" ADD CONSTRAINT "DailyWarmup_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;
