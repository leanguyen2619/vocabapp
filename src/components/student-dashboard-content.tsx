import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Library } from "lucide-react";

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
  dict,
}: {
  account: Account;
  dailyAssignments: DailyAssignmentWithVocab[];
  levels: LevelWithProgress[];
  topics: Topic[];
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
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vocabulary" />}>
          <Library className="size-4" />
          {dict.studentDashboard.myVocabulary}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {levels.map((level) => (
          <LevelCard key={level.id} level={level} dict={dict} />
        ))}
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
    </div>
  );
}
