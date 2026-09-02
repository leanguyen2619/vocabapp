import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { ListeningComprehensionGame } from "@/components/listening-comprehension-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getListeningComprehensionQuestionsAction } from "@/lib/actions/practice-content";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.listeningComprehension };
}

export default async function ListeningComprehensionPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, exerciseTypes, rawQuestions] = await Promise.all([
    getMyWarmupStatusAction(),
    listVisibleExerciseTypesAction(),
    getListeningComprehensionQuestionsAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  // Shuffled here (once, server-side) rather than in the client component — see
  // ListeningComprehensionGame for why shuffling client-side causes a hydration mismatch.
  const questions = shuffle(rawQuestions).map((q) => ({ ...q, options: shuffle(q.options) }));

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PracticeHeader currentCode="listening_comprehension" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <ListeningComprehensionGame questions={questions} dict={dict} />
      </main>
    </div>
  );
}
