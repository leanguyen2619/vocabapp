import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { WordFormationGame } from "@/components/word-formation-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getWordFormationPromptsAction } from "@/lib/actions/practice-content";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { prepareWordFormation } from "@/lib/practice-prep";
import { getCurrentAccount } from "@/lib/session";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.wordFormation };
}

export default async function WordFormationPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, exerciseTypes, rawPrompts] = await Promise.all([
    getMyWarmupStatusAction(),
    listVisibleExerciseTypesAction(),
    getWordFormationPromptsAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  // Shuffled here (once, server-side) rather than in the client component — see
  // WordFormationGame for why shuffling client-side causes a hydration mismatch.
  const prompts = prepareWordFormation(rawPrompts);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="word_formation" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <WordFormationGame prompts={prompts} dict={dict} />
      </main>
    </div>
  );
}
