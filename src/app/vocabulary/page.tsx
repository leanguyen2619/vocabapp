import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getMyVocabularyWithProgressAction, listTopicsAction } from "@/lib/actions/vocabulary";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { listLevelsAction } from "@/lib/actions/levels";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";
import { VocabularyClient } from "./vocabulary-client";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.vocabulary.title };
}

export default async function VocabularyPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, myVocabulary, levels, topics] = await Promise.all([
    getMyWarmupStatusAction(),
    getMyVocabularyWithProgressAction(),
    listLevelsAction(),
    listTopicsAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  return (
    <VocabularyClient myVocabulary={myVocabulary} levels={levels} topics={topics} dict={dict} />
  );
}
