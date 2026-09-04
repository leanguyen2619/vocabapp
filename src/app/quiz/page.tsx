import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { QuizSession } from "@/components/quiz-session";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyQuizQuestionsAction, listTopicsAction } from "@/lib/actions/vocabulary";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { parseWordScope } from "@/lib/word-scope";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.quiz };
}

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  const scope = parseWordScope((await searchParams).scope);

  const [warmupStatus, questions, topics, exerciseTypes] = await Promise.all([
    getMyWarmupStatusAction(),
    getMyQuizQuestionsAction(scope),
    listTopicsAction(),
    listVisibleExerciseTypesAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="multiple_choice" types={exerciseTypes} dict={dict} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <QuizSession questions={questions} topics={topics} dict={dict} />
      </main>
    </div>
  );
}
