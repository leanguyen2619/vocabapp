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

import { AdminStudentsPanel } from "@/components/admin-students-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMessage } from "@/lib/i18n/format";
import type { AssignedVocabSummary, StudentSummary } from "@/lib/actions/students";
import type { Dictionary } from "@/lib/i18n/dictionaries";
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
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {formatMessage(dict.adminDashboard.greeting, { name: account.fullName })}
        </h1>
        <p className="text-muted-foreground">{dict.adminDashboard.subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{studentCount}</p>
              <p className="text-xs text-muted-foreground">{dict.adminDashboard.students}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{classCount}</p>
              <p className="text-xs text-muted-foreground">{dict.adminDashboard.classes}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Library className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{vocabCount}</p>
              <p className="text-xs text-muted-foreground">{dict.adminDashboard.vocabulary}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
