-- CreateEnum
CREATE TYPE "AssignmentSource" AS ENUM ('manual', 'auto_continuation', 'auto_default');

-- AlterTable
ALTER TABLE "DailyAssignment" ADD COLUMN     "source" "AssignmentSource" NOT NULL DEFAULT 'manual';
