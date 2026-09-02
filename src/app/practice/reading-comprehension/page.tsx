import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { ReadingComprehensionGame } from "@/components/reading-comprehension-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyReadingPassageAction } from "@/lib/actions/practice-content";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.readingComprehension };
}

export default async function ReadingComprehensionPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, exerciseTypes, rawPassage] = await Promise.all([
    getMyWarmupStatusAction(),
    listVisibleExerciseTypesAction(),
    getMyReadingPassageAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  // Blank order stays as authored (matches the passage's own numbering) — only each blank's own
  // options are shuffled, server-side, same hydration-safety reasoning as every other game here.
  const passage = rawPassage && { ...rawPassage, blanks: rawPassage.blanks.map((b) => ({ ...b, options: shuffle(b.options) })) };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PracticeHeader currentCode="reading_comprehension" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <ReadingComprehensionGame passage={passage} dict={dict} />
      </main>
    </div>
  );
}
