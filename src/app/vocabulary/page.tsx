import { redirect } from "next/navigation";

import { getMyVocabularyWithProgressAction, listTopicsAction } from "@/lib/actions/vocabulary";
import { listLevelsAction } from "@/lib/actions/levels";
import { getCurrentAccount } from "@/lib/session";
import { VocabularyClient } from "./vocabulary-client";

export default async function VocabularyPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const [myVocabulary, levels, topics] = await Promise.all([
    getMyVocabularyWithProgressAction(),
    listLevelsAction(),
    listTopicsAction(),
  ]);

  return <VocabularyClient myVocabulary={myVocabulary} levels={levels} topics={topics} />;
}
