import { redirect } from "next/navigation";

import { AdminDashboardContent } from "@/components/admin-dashboard-content";
import { StudentDashboardContent } from "@/components/student-dashboard-content";
import { TeacherDashboardContent } from "@/components/teacher-dashboard-content";
import { listAccountsAction } from "@/lib/actions/accounts";
import { listClassesAction } from "@/lib/actions/classes";
import { getMyLevelsAction } from "@/lib/actions/levels";
import { getMyClassStudentsAction } from "@/lib/actions/teacher";
import { getMyDailyAssignmentsAction, listTopicsAction, listVocabularyAction } from "@/lib/actions/vocabulary";
import { getCurrentAccount } from "@/lib/session";
import { DashboardShell } from "./dashboard-client";

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  if (account.role === "admin") {
    const [accounts, classes, vocabulary] = await Promise.all([
      listAccountsAction(),
      listClassesAction(),
      listVocabularyAction(),
    ]);
    const studentCount = accounts.filter((a) => a.account.role === "student").length;

    return (
      <DashboardShell account={account} streak={0}>
        <AdminDashboardContent
          account={account}
          studentCount={studentCount}
          classCount={classes.length}
          vocabCount={vocabulary.length}
        />
      </DashboardShell>
    );
  }

  if (account.role === "teacher") {
    const [classes, students, vocabularyBank] = await Promise.all([
      listClassesAction(),
      getMyClassStudentsAction(),
      listVocabularyAction(),
    ]);
    const className = classes.find((c) => c.id === account.classId)?.className ?? null;

    return (
      <DashboardShell account={account} streak={0}>
        <TeacherDashboardContent
          account={account}
          className={className}
          students={students}
          vocabularyBank={vocabularyBank}
        />
      </DashboardShell>
    );
  }

  const [levels, dailyAssignments, topics] = await Promise.all([
    getMyLevelsAction(),
    getMyDailyAssignmentsAction(),
    listTopicsAction(),
  ]);
  const streak = levels.find((l) => l.status === "in_progress")?.streak ?? 0;

  return (
    <DashboardShell account={account} streak={streak}>
      <StudentDashboardContent
        account={account}
        dailyAssignments={dailyAssignments}
        levels={levels}
        topics={topics}
      />
    </DashboardShell>
  );
}
