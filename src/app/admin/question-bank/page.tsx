import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listQuestionsAction } from "@/lib/actions/questions";
import { listVocabularyAction } from "@/lib/actions/vocabulary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { AdminQuestionBankClient } from "./question-bank-client";

export default async function AdminQuestionBankPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const [initialQuestions, vocabularyBank] = await Promise.all([
    listQuestionsAction(),
    listVocabularyAction(),
  ]);

  return (
    <AdminQuestionBankClient
      initialQuestions={initialQuestions}
      vocabularyBank={vocabularyBank}
      dict={dict}
    />
  );
}
