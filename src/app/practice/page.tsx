import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { PracticeSession } from "@/components/practice-session";
import { RandomExerciseButton } from "@/components/random-exercise-button";
import { listExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyWordsForScopeAction, listTopicsAction } from "@/lib/actions/vocabulary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { parseWordScope } from "@/lib/word-scope";

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  const scope = parseWordScope((await searchParams).scope);

  const [dailyWords, topics, exerciseTypes] = await Promise.all([
    getMyWordsForScopeAction(scope),
    listTopicsAction(),
    listExerciseTypesAction(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              {dict.common.backToDashboard}
            </Link>
            <RandomExerciseButton currentCode="flashcard" types={exerciseTypes} dict={dict} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <PracticeSession vocabList={dailyWords} topics={topics} dict={dict} />
      </main>
    </div>
  );
}
