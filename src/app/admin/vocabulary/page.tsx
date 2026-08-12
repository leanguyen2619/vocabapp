import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listLevelsAction } from "@/lib/actions/levels";
import { listTopicsAction, listVocabularyAction } from "@/lib/actions/vocabulary";
import { getCurrentAccount } from "@/lib/session";
import { AdminVocabularyClient } from "./vocabulary-client";

export default async function AdminVocabularyPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (account.role !== "admin") return <AdminOnlyDenied />;

  const [initialWords, levels, topics] = await Promise.all([
    listVocabularyAction(),
    listLevelsAction(),
    listTopicsAction(),
  ]);

  return <AdminVocabularyClient initialWords={initialWords} levels={levels} topics={topics} />;
}
