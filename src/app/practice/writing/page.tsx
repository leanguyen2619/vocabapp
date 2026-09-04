import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { SentenceWritingExercise } from "@/components/sentence-writing-exercise";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getSentenceWritingPromptsAction } from "@/lib/actions/practice-content";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.sentenceWriting };
}

export default async function SentenceWritingPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, exerciseTypes, prompts] = await Promise.all([
    getMyWarmupStatusAction(),
    listVisibleExerciseTypesAction(),
    getSentenceWritingPromptsAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="sentence_writing" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <SentenceWritingExercise prompts={prompts} dict={dict} />
      </main>
    </div>
  );
}
