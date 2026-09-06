import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { PracticeHeader } from "@/components/practice-header";
import { PracticeCard } from "@/components/practice-card";
import { PosClassificationGame } from "@/components/pos-classification-game";
import { listVisibleExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getPosClassificationItemsAction, listTopicsAction } from "@/lib/actions/vocabulary";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { buildPosQuestions } from "@/lib/practice-prep";
import { getCurrentAccount } from "@/lib/session";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.pos };
}

export default async function PosClassificationPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, items, topics, exerciseTypes] = await Promise.all([
    getMyWarmupStatusAction(),
    getPosClassificationItemsAction(),
    listTopicsAction(),
    listVisibleExerciseTypesAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  // Shuffled here (once, server-side) rather than in the client component — see
  // PosClassificationGame for why shuffling client-side causes a hydration mismatch.
  const questions = buildPosQuestions(items);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <PracticeHeader currentCode="pos_classification" types={exerciseTypes} dict={dict} />

      <PracticeCard>
        <PosClassificationGame questions={questions} topics={topics} dict={dict} />
      </PracticeCard>
    </div>
  );
}
