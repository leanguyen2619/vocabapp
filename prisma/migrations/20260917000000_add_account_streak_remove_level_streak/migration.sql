-- Streak moves from per-(account, level) on AccountLevel to a single value per Account.
-- See the schema.prisma comment on Account.streak for why.

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "lastActivityDate" TIMESTAMP(3),
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0;

-- Data migration: seed the new Account-level fields from whichever AccountLevel row currently
-- holds the highest streak for that account — i.e. exactly the value the app already displays
-- today (Math.max over levels) — so this migration doesn't reset anyone's visible streak to 0.
UPDATE "Account" a
SET "streak" = sub.streak,
    "lastActivityDate" = sub."lastActivityDate"
FROM (
  SELECT DISTINCT ON ("accountId") "accountId", streak, "lastActivityDate"
  FROM "AccountLevel"
  ORDER BY "accountId", streak DESC
) sub
WHERE sub."accountId" = a.id_login;

-- AlterTable
ALTER TABLE "AccountLevel" DROP COLUMN "lastActivityDate",
DROP COLUMN "streak";
