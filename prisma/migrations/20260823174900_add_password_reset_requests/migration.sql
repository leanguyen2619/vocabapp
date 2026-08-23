-- CreateEnum
CREATE TYPE "PasswordResetRequestStatus" AS ENUM ('pending', 'resolved');

-- CreateTable
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "PasswordResetRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetRequest_accountId_idx" ON "PasswordResetRequest"("accountId");

-- AddForeignKey
ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id_login") ON DELETE CASCADE ON UPDATE CASCADE;
