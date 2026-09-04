import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { WordTransformationGame } from "@/components/word-transformation-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getWordTransformationPromptsAction } from "@/lib/actions/practice-content";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.wordTransformation };
}

export default async function WordTransformationPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, exerciseTypes, rawPrompts] = await Promise.all([
    getMyWarmupStatusAction(),
    listVisibleExerciseTypesAction(),
    getWordTransformationPromptsAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  // Shuffled here (once, server-side) rather than in the client component — see FillBlankGame
  // for why shuffling client-side causes a hydration mismatch. Every other practice type shows
  // its full available-question pool per attempt (see FillBlankPage); this one used to cut down
  // to a single random sentence, which made it feel broken next to every other exercise.
  const prompts = shuffle(rawPrompts);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="word_transformation" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <WordTransformationGame prompts={prompts} dict={dict} />
      </main>
    </div>
  );
}
