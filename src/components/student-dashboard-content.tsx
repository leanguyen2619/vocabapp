import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Library, PenLine, Sparkles } from "lucide-react";

import { LevelCard } from "@/components/level-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getTopicName } from "@/lib/labels";
import type {
  Account,
  AssignmentStatus,
  DailyAssignmentWithVocab,
  LevelWithProgress,
  Topic,
} from "@/types";

export function StudentDashboardContent({
  account,
  dailyAssignments,
  levels,
  topics,
  newWordsCount,
  dict,
}: {
  account: Account;
  dailyAssignments: DailyAssignmentWithVocab[];
  levels: LevelWithProgress[];
  topics: Topic[];
  newWordsCount: number;
  dict: Dictionary;
}) {
  const completedCount = dailyAssignments.filter((a) => a.status === "done").length;
  const assignmentStatusLabel: Record<AssignmentStatus, string> = dict.assignmentStatus;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {formatMessage(dict.studentDashboard.greeting, { name: account.fullName })}
          </h1>
          <p className="text-muted-foreground">
            {formatMessage(dict.studentDashboard.progressToday, {
              done: completedCount,
              total: dailyAssignments.length,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vocabulary" />}>
            <Library className="size-4" />
            {dict.studentDashboard.myVocabulary}
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/writing-results" />}>
            <PenLine className="size-4" />
            {dict.studentDashboard.writingResults}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{dict.studentDashboard.todayWords}</CardTitle>
              <CardDescription>
                {formatMessage(dict.studentDashboard.todayWordsDesc, { count: dailyAssignments.length })}
              </CardDescription>
            </div>
            <Button size="sm" nativeButton={false} render={<Link href="/exercises" />}>
              {dict.studentDashboard.chooseExerciseType}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {dailyAssignments.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
              <BookOpen className="size-8" />
              <p className="max-w-xs text-sm">{dict.studentDashboard.noWordsToday}</p>
            </div>
          )}
          {dailyAssignments.map((assignment, index) => (
            <div key={assignment.assignmentId}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {assignment.status === "done" ? (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{assignment.vocab.vocab}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.vocab.meanVI} · {getTopicName(topics, assignment.vocab.topicId)}
                    </p>
                  </div>
                </div>
                <Badge variant={assignment.status === "done" ? "default" : "outline"}>
                  {assignmentStatusLabel[assignment.status]}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {newWordsCount > 0 && (
        <Card className="border-sky-300 bg-sky-50/50">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Sparkles className="size-4" />
              </div>
              <div>
                <p className="font-medium">{dict.studentDashboard.newWordsTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {formatMessage(dict.studentDashboard.newWordsDesc, { count: newWordsCount })}
                </p>
              </div>
            </div>
            <Button size="sm" nativeButton={false} render={<Link href="/practice?scope=new" />}>
              {dict.studentDashboard.newWordsButton}
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {levels.map((level) => (
          <LevelCard key={level.id} level={level} dict={dict} />
        ))}
      </div>
    </div>
  );
}
