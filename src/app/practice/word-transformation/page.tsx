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

  // Each attempt is a single randomly drawn sentence out of the full bank, not the whole bank —
  // shuffled server-side (see FillBlankGame for why client-side shuffling causes a hydration
  // mismatch) and cut down to 1 before it ever reaches the client.
  const prompts = shuffle(rawPrompts).slice(0, 1);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="word_transformation" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <WordTransformationGame prompts={prompts} dict={dict} />
      </main>
    </div>
  );
}
