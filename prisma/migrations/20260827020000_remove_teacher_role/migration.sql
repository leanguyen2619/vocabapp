-- DataMigration: fold existing teacher accounts into admin before the enum stops allowing "teacher"
UPDATE "Account" SET "role" = 'admin' WHERE "role" = 'teacher';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('student', 'admin');
ALTER TABLE "Account" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;
