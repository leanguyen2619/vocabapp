import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";

import { AdminOverviewCard } from "@/components/admin-overview-card";
import { AdminStudentsPanel } from "@/components/admin-students-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StudentSummary } from "@/lib/actions/students";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";
import type { Account, Level, Topic, Vocabulary } from "@/types";

interface AdminFunction {
  title: string;
  description: string;
  /** Hand-picked reindeer-themed illustration (see public/admin-icons/) — width/height are the
   * source file's real pixel size so next/image can size the box without distorting the icon's own
   * aspect ratio (they vary since each was cropped to just above where its original caption text
   * started, not a single template). */
  iconSrc: string;
  iconWidth: number;
  iconHeight: number;
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
  topics: Topic[];
  levels: Level[];
  locale: Locale;
  dict: Dictionary;
}) {
  const adminFunctions: AdminFunction[] = [
    {
      title: dict.adminDashboard.fnAccountsTitle,
      description: dict.adminDashboard.fnAccountsDesc,
      iconSrc: "/admin-icons/accounts.png",
      iconWidth: 232,
      iconHeight: 232,
      href: "/admin/accounts",
    },
    {
      title: dict.adminDashboard.fnClassesTitle,
      description: dict.adminDashboard.fnClassesDesc,
      iconSrc: "/admin-icons/classes.png",
      iconWidth: 120,
      iconHeight: 120,
      href: "/admin/classes",
    },
    {
      title: dict.adminDashboard.fnVocabTitle,
      description: dict.adminDashboard.fnVocabDesc,
      iconSrc: "/admin-icons/vocabulary.png",
      iconWidth: 122,
      iconHeight: 104,
      href: "/admin/vocabulary",
    },
    {
      title: dict.adminDashboard.fnExerciseTypesTitle,
      description: dict.adminDashboard.fnExerciseTypesDesc,
      iconSrc: "/admin-icons/exercise-types.png",
      iconWidth: 122,
      iconHeight: 104,
      href: "/admin/exercise-types",
    },
    {
      title: dict.adminDashboard.fnQuestionBankTitle,
      description: dict.adminDashboard.fnQuestionBankDesc,
      iconSrc: "/admin-icons/question-bank.png",
      iconWidth: 135,
      iconHeight: 115,
      href: "/admin/question-bank",
    },
    {
      title: dict.adminDashboard.fnLevelsTitle,
      description: dict.adminDashboard.fnLevelsDesc,
      iconSrc: "/admin-icons/levels.png",
      iconWidth: 125,
      iconHeight: 106,
      href: "/admin/levels",
    },
    {
      title: dict.adminDashboard.fnWritingTitle,
      description: dict.adminDashboard.fnWritingDesc,
      iconSrc: "/admin-icons/writing.png",
      iconWidth: 140,
      iconHeight: 119,
      href: "/admin/writing-submissions",
      count: pendingWritingCount,
    },
    {
      title: dict.adminDashboard.fnClassReportTitle,
      description: dict.adminDashboard.fnClassReportDesc,
      iconSrc: "/admin-icons/class-report.png",
      iconWidth: 127,
      iconHeight: 108,
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
            const isReady = Boolean(fn.href);

            const cardBody = (
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between">
                  <Image
                    src={fn.iconSrc}
                    alt=""
                    width={fn.iconWidth}
                    height={fn.iconHeight}
                    className="h-14 w-auto"
                  />
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
                <Card key={fn.title} className="bg-card/85 opacity-60 backdrop-blur-sm">
                  {cardBody}
                </Card>
              );
            }

            return (
              <Link key={fn.title} href={fn.href!}>
                <Card className="h-full bg-card/85 backdrop-blur-sm transition-colors hover:border-primary/50">
                  {cardBody}
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <AdminStudentsPanel
        students={students}
        vocabularyBank={vocabularyBank}
        topics={topics}
        levels={levels}
        dict={dict}
      />
    </div>
  );
}
