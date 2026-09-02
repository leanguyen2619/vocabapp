import Link from "next/link";
import {
  BarChart3,
  Building2,
  Clock,
  Library,
  PenLine,
  Settings2,
  TrendingDown,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AdminOverviewCard } from "@/components/admin-overview-card";
import { AdminStudentsPanel } from "@/components/admin-students-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AssignedVocabSummary, StudentSummary } from "@/lib/actions/students";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import type { Account, Level, Topic, Vocabulary } from "@/types";

interface AdminFunction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
  count?: number;
}

export function AdminDashboardContent({
  account,
  studentCount,
  classCount,
  vocabCount,
  pendingWritingCount,
  weakWordsCount,
  students,
  vocabularyBank,
  assignedVocab,
  topics,
  levels,
  locale,
  dict,
}: {
  account: Account;
  studentCount: number;
  classCount: number;
  vocabCount: number;
  pendingWritingCount: number;
  weakWordsCount: number;
  students: StudentSummary[];
  vocabularyBank: Vocabulary[];
  assignedVocab: AssignedVocabSummary[];
  topics: Topic[];
  levels: Level[];
  locale: Locale;
  dict: Dictionary;
}) {
  const adminFunctions: AdminFunction[] = [
    {
      title: dict.adminDashboard.fnAccountsTitle,
      description: dict.adminDashboard.fnAccountsDesc,
      icon: Users,
      href: "/admin/accounts",
    },
    {
      title: dict.adminDashboard.fnClassesTitle,
      description: dict.adminDashboard.fnClassesDesc,
      icon: Building2,
      href: "/admin/classes",
    },
    {
      title: dict.adminDashboard.fnVocabTitle,
      description: dict.adminDashboard.fnVocabDesc,
      icon: Library,
      href: "/admin/vocabulary",
    },
    {
      title: dict.adminDashboard.fnExerciseTypesTitle,
      description: dict.adminDashboard.fnExerciseTypesDesc,
      icon: Settings2,
      href: "/admin/exercise-types",
    },
    {
      title: dict.adminDashboard.fnQuestionBankTitle,
      description: dict.adminDashboard.fnQuestionBankDesc,
      icon: BarChart3,
      href: "/admin/question-bank",
    },
    {
      title: dict.adminDashboard.fnLevelsTitle,
      description: dict.adminDashboard.fnLevelsDesc,
      icon: Users,
      href: "/admin/levels",
    },
    {
      title: dict.adminDashboard.fnWritingTitle,
      description: dict.adminDashboard.fnWritingDesc,
      icon: PenLine,
      href: "/admin/writing-submissions",
      count: pendingWritingCount,
    },
    {
      title: dict.adminDashboard.fnClassReportTitle,
      description: dict.adminDashboard.fnClassReportDesc,
      icon: TrendingDown,
      href: "/admin/class-report",
      count: weakWordsCount,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <AdminOverviewCard
        fullName={account.fullName}
        studentCount={studentCount}
        classCount={classCount}
        vocabCount={vocabCount}
        pendingWritingCount={pendingWritingCount}
        locale={locale}
        dict={dict}
      />

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          {dict.adminDashboard.functionsTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminFunctions.map((fn) => {
            const Icon = fn.icon;
            const isReady = Boolean(fn.href);

            const cardBody = (
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  {Boolean(fn.count) && <Badge>{fn.count}</Badge>}
                </div>
                <div>
                  <p className="font-medium">{fn.title}</p>
                  <p className="text-sm text-muted-foreground">{fn.description}</p>
                </div>
                {!isReady && (
                  <Badge variant="outline" className="w-fit gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    {dict.adminDashboard.comingSoon}
                  </Badge>
                )}
              </CardContent>
            );

            if (!isReady) {
              return (
                <Card key={fn.title} className="opacity-60">
                  {cardBody}
                </Card>
              );
            }

            return (
              <Link key={fn.title} href={fn.href!}>
                <Card className="h-full transition-colors hover:border-primary/50">{cardBody}</Card>
              </Link>
            );
          })}
        </div>
      </div>

      <AdminStudentsPanel
        students={students}
        vocabularyBank={vocabularyBank}
        assignedVocab={assignedVocab}
        topics={topics}
        levels={levels}
        dict={dict}
      />
    </div>
  );
}
