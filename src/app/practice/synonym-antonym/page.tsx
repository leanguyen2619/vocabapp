import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { SynonymAntonymGame } from "@/components/synonym-antonym-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getSynonymAntonymQuestionsAction } from "@/lib/actions/practice-content";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.synonymAntonym };
}

export default async function SynonymAntonymPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, exerciseTypes, rawQuestions] = await Promise.all([
    getMyWarmupStatusAction(),
    listVisibleExerciseTypesAction(),
    getSynonymAntonymQuestionsAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  // Shuffled here (once, server-side) rather than in the client component — see
  // SynonymAntonymGame for why shuffling client-side causes a hydration mismatch.
  const questions = shuffle(rawQuestions).map((q) => ({ ...q, options: shuffle(q.options) }));

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="synonym_antonym" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <SynonymAntonymGame questions={questions} dict={dict} />
      </main>
    </div>
  );
}
