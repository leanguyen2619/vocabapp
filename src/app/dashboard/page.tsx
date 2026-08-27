import { redirect } from "next/navigation";

import { AdminDashboardContent } from "@/components/admin-dashboard-content";
import { StudentDashboardContent } from "@/components/student-dashboard-content";
import { listAccountsAction } from "@/lib/actions/accounts";
import { listClassesAction } from "@/lib/actions/classes";
import { getMyLevelsAction } from "@/lib/actions/levels";
import { listAllAssignedVocabAction, listAllStudentsAction } from "@/lib/actions/students";
import {
  getMyDailyAssignmentsAction,
  getMyWordsForScopeAction,
  listTopicsAction,
  listVocabularyAction,
} from "@/lib/actions/vocabulary";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { requireWarmupComplete } from "@/lib/warmup-guard";
import { DashboardShell } from "./dashboard-client";

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  await requireWarmupComplete();
  const dict = getDictionary(await getLocale());

  if (account.role === "admin") {
    const [accounts, classes, vocabulary, students, assignedVocab] = await Promise.all([
      listAccountsAction(),
      listClassesAction(),
      listVocabularyAction(),
      listAllStudentsAction(),
      listAllAssignedVocabAction(),
    ]);
    const studentCount = accounts.filter((a) => a.account.role === "student").length;

    return (
      <DashboardShell account={account} streak={0}>
        <AdminDashboardContent
          account={account}
          studentCount={studentCount}
          classCount={classes.length}
          vocabCount={vocabulary.length}
          students={students}
          vocabularyBank={vocabulary}
          assignedVocab={assignedVocab}
          dict={dict}
        />
      </DashboardShell>
    );
  }

  const [levels, dailyAssignments, topics, newWords] = await Promise.all([
    getMyLevelsAction(),
    getMyDailyAssignmentsAction(),
    listTopicsAction(),
    getMyWordsForScopeAction("new"),
  ]);
  // Matches profile-client.tsx's formula so the two pages never disagree on the number shown.
  const streak = Math.max(0, ...levels.map((l) => l.streak));

  return (
    <DashboardShell account={account} streak={streak}>
      <StudentDashboardContent
        account={account}
        dailyAssignments={dailyAssignments}
        levels={levels}
        topics={topics}
        newWordsCount={newWords.length}
        dict={dict}
      />
    </DashboardShell>
  );
}
