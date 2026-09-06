import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { PracticeCard } from "@/components/practice-card";
import { TypingGame } from "@/components/typing-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyStudentLevelIndexAction } from "@/lib/actions/levels";
import { getMyWordsForScopeAction } from "@/lib/actions/vocabulary";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { B1_LEVEL_ORDINAL } from "@/lib/utils";
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

  const [warmupStatus, dailyWords, exerciseTypes, studentLevelIndex] = await Promise.all([
    getMyWarmupStatusAction(),
    getMyWordsForScopeAction(scope),
    listVisibleExerciseTypesAction(),
    account.role === "student" ? getMyStudentLevelIndexAction() : Promise.resolve(null),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);
  // Non-students (teacher/admin previewing) always get it, same convention as
  // listVisibleExerciseTypesAction's own maxLevel fallback.
  const showEnglishDefinition = studentLevelIndex === null || studentLevelIndex >= B1_LEVEL_ORDINAL;

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="typing" types={exerciseTypes} dict={dict} />

      <PracticeCard>
        <TypingGame vocabList={dailyWords} dict={dict} showEnglishDefinition={showEnglishDefinition} />
      </PracticeCard>
    </div>
  );
}
