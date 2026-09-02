import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { TypingGame } from "@/components/typing-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyWordsForScopeAction } from "@/lib/actions/vocabulary";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { parseWordScope } from "@/lib/word-scope";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.typing };
}

export default async function TypingPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  const scope = parseWordScope((await searchParams).scope);

  const [warmupStatus, dailyWords, exerciseTypes] = await Promise.all([
    getMyWarmupStatusAction(),
    getMyWordsForScopeAction(scope),
    listVisibleExerciseTypesAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <PracticeHeader currentCode="typing" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <TypingGame vocabList={dailyWords} dict={dict} />
      </main>
    </div>
  );
}
