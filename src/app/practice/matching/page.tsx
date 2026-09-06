import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { PracticeCard } from "@/components/practice-card";
import { MatchingGame } from "@/components/matching-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyWordsForScopeAction } from "@/lib/actions/vocabulary";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { shuffle } from "@/lib/utils";
import { parseWordScope } from "@/lib/word-scope";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.matching };
}

export default async function MatchingPage({
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

  // Shuffled here (once, server-side, independently per column) rather than in the client
  // component — see MatchingGame for why shuffling client-side causes a hydration mismatch.
  const leftItems = shuffle(dailyWords);
  const rightItems = shuffle(dailyWords);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="matching" types={exerciseTypes} dict={dict} />

      <PracticeCard>
        <MatchingGame leftItems={leftItems} rightItems={rightItems} dict={dict} />
      </PracticeCard>
    </div>
  );
}
