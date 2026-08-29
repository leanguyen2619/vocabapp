import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listLevelsAction } from "@/lib/actions/levels";
import { listTopicsAction, listVocabularyAction } from "@/lib/actions/vocabulary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { AdminVocabularyClient } from "./vocabulary-client";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.admin.vocabulary.title };
}

export default async function AdminVocabularyPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const [initialWords, levels, topics] = await Promise.all([
    listVocabularyAction(),
    listLevelsAction(),
    listTopicsAction(),
  ]);

  return (
    <AdminVocabularyClient initialWords={initialWords} levels={levels} topics={topics} dict={dict} />
  );
}
