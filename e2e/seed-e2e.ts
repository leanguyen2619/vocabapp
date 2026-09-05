import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { startOfUTCDay } from "../src/lib/today";

// Runs on top of prisma/seed.ts (which creates HS0001/QT0001 and the demo vocab/question bank).
// This adds the two things that would otherwise make the e2e flows non-deterministic:
//
// 1. A DailyWarmup row for HS0001 already marked complete for today — without this, the very
//    first student page hit each day redirects to /warmup and hands out 3 RANDOMLY chosen
//    exercise types (see redirectIfWarmupIncomplete / selectWarmupTypes in
//    src/lib/actions/warmup.ts), which isn't something a test can assert against reliably.
// 2. A DailyWordPick row pinning HS0001's "today's word" to vocab_101 ("ambitious"), which has a
//    real approved multiple_choice Question (q_1) in the seed data — so the quiz always shows
//    the same question instead of whatever computeDailyWords would otherwise auto-pick (see
//    computeDailyWords in src/lib/actions/vocabulary.ts, which reads back an existing
//    DailyWordPick for the day instead of recomputing once one exists).
//
// Uses the app's own startOfUTCDay (Vietnam/ICT midnight, deterministic regardless of the calling
// process's own timezone) rather than a local re-implementation — this script previously computed
// "today" via `new Date(); .setHours(0,0,0,0)` (the calling process's own local time), which
// happened to agree with the app's old plain-UTC-day boundary on CI (UTC) but silently diverged
// the moment the app's boundary was fixed to real Vietnam midnight, leaving this seed's pinned
// picks dated for a different "today" than what the running app would look up.

const adapter = new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL }));
const prisma = new PrismaClient({ adapter });

async function main() {
  const today = startOfUTCDay();

  await prisma.dailyWarmup.upsert({
    where: { accountId_warmupDate: { accountId: "HS0001", warmupDate: today } },
    update: { practiceTypeCodes: ["multiple_choice"], completedCodes: ["multiple_choice"] },
    create: {
      accountId: "HS0001",
      warmupDate: today,
      practiceTypeCodes: ["multiple_choice"],
      completedCodes: ["multiple_choice"],
    },
  });

  await prisma.dailyWordPick.upsert({
    where: { accountId_vocabId_pickedDate: { accountId: "HS0001", vocabId: "vocab_101", pickedDate: today } },
    update: {},
    create: { accountId: "HS0001", vocabId: "vocab_101", pickedDate: today },
  });

  console.log("e2e seed: HS0001 warmup marked complete, today's word pinned to vocab_101.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
