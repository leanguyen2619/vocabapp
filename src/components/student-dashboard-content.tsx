import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, ClipboardCheck, Library } from "lucide-react";

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
import { dailyAssignments, levels } from "@/lib/mock-data";
import type { Account, AssignmentStatus } from "@/types";

const assignmentStatusLabel: Record<AssignmentStatus, string> = {
  pending: "Chưa làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
  overdue: "Quá hạn",
};

export function StudentDashboardContent({ account }: { account: Account }) {
  const completedCount = dailyAssignments.filter((a) => a.status === "done").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Chào {account.fullName}, sẵn sàng học chưa?
          </h1>
          <p className="text-muted-foreground">
            Bạn đã hoàn thành {completedCount}/{dailyAssignments.length} từ vựng được giao hôm nay.
          </p>
        </div>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vocabulary" />}>
          <Library className="size-4" />
          Kho từ vựng
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {levels.map((level) => (
          <LevelCard key={level.id} level={level} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Từ vựng hôm nay</CardTitle>
              <CardDescription>Danh sách bài tập được giao ngày 21/07/2026</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/quiz" />}
              >
                <ClipboardCheck className="size-4" />
                Làm kiểm tra
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/practice" />}>
                Luyện tập ngay
                <ArrowRight className="size-4" />
              </Button>
            </div>
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
                      {assignment.vocab.meanVI} · {assignment.vocab.topic}
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
