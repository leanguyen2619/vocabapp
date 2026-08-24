-- Removes the unused "banned" value from AccountStatus. No admin UI path ever set this status,
-- so no existing row can hold it; the USING cast below is safe.
BEGIN;

ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
CREATE TYPE "AccountStatus" AS ENUM ('active', 'inactive');
ALTER TABLE "Account" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Account" ALTER COLUMN "status" TYPE "AccountStatus" USING ("status"::text::"AccountStatus");
ALTER TABLE "Account" ALTER COLUMN "status" SET DEFAULT 'active';
DROP TYPE "AccountStatus_old";

COMMIT;
