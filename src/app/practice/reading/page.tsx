import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { ReadingPracticeGame } from "@/components/reading-practice-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyReadingTextAction } from "@/lib/actions/practice-content";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.readingPractice };
}

export default async function ReadingPracticePage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, exerciseTypes, rawText] = await Promise.all([
    getMyWarmupStatusAction(),
    listVisibleExerciseTypesAction(),
    getMyReadingTextAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  // Question order stays as authored (matches reading order in the passage) — only each
  // question's own options are shuffled, server-side, same hydration-safety reasoning as every
  // other game here.
  const text = rawText && { ...rawText, questions: rawText.questions.map((q) => ({ ...q, options: shuffle(q.options) })) };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PracticeHeader currentCode="reading_practice" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <ReadingPracticeGame text={text} dict={dict} />
      </main>
    </div>
  );
}
