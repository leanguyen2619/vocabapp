import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listExerciseTypesAction } from "@/lib/actions/exercise-types";
import { listQuestionsAction } from "@/lib/actions/questions";
import { listVocabularyAction } from "@/lib/actions/vocabulary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import type { PracticeTypeCode } from "@/types";
import { AdminQuestionBankClient } from "./question-bank-client";

/** The practice types whose content is authored as Question/Answer rows — the rest (flashcard,
 * matching, pos_classification, typing, listening) operate directly on the Vocabulary bank. */
const QUESTION_BASED_CODES: PracticeTypeCode[] = [
  "multiple_choice",
  "synonym_antonym",
  "fill_blank",
  "word_formation",
  "sentence_writing",
];

export default async function AdminQuestionBankPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const [initialQuestions, vocabularyBank, exerciseTypes] = await Promise.all([
    listQuestionsAction("multiple_choice"),
    listVocabularyAction(),
    listExerciseTypesAction(),
  ]);

  const practiceTypes = QUESTION_BASED_CODES.map((code) => ({
    code,
    name: exerciseTypes.find((t) => t.code === code)?.name ?? code,
  }));

  return (
    <AdminQuestionBankClient
      initialQuestions={initialQuestions}
      vocabularyBank={vocabularyBank}
      practiceTypes={practiceTypes}
      dict={dict}
    />
  );
}
