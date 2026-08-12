"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BellRing, CheckCircle2, Circle, ClipboardList, Flame, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { classStudents, vocabToday } from "@/lib/mock-data";
import type { Account, AssignmentStatus } from "@/types";

const statusLabel: Record<AssignmentStatus, string> = {
  pending: "Chưa làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
  overdue: "Quá hạn",
};

export function TeacherDashboardContent({
  account,
  className: assignedClassName,
}: {
  account: Account;
  className: string | null;
}) {
  const [selectedVocab, setSelectedVocab] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const className = assignedClassName ?? "lớp của bạn";
  const studentCount = classStudents.length;
  const averageScore = Math.round(
    classStudents.reduce((sum, s) => sum + s.score, 0) / studentCount
  );
  const doneToday = classStudents.filter((s) => s.todayStatus === "done").length;

  const toggleVocab = (vocabId: string) => {
    setSelectedVocab((current) =>
      current.includes(vocabId) ? current.filter((id) => id !== vocabId) : [...current, vocabId]
    );
  };

  const handleAssign = () => {
    setDialogOpen(false);
    toast.success(`Đã giao ${selectedVocab.length} từ vựng cho ${studentCount} học sinh.`);
    setSelectedVocab([]);
  };

  const handleRemind = (name: string) => {
    toast.success(`Đã gửi nhắc nhở đến ${name}.`);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Chào {account.fullName}
          </h1>
          <p className="text-muted-foreground">Tổng quan {className} bạn đang phụ trách.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <ClipboardList className="size-4" />
            Giao từ vựng mới
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Giao từ vựng cho {className}</DialogTitle>
              <DialogDescription>Chọn từ vựng muốn giao cho toàn bộ học sinh.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              {vocabToday.map((vocab) => (
                <Label
                  key={vocab.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <Checkbox
                    checked={selectedVocab.includes(vocab.id)}
                    onCheckedChange={() => toggleVocab(vocab.id)}
                  />
                  <span className="flex-1">
                    <span className="font-medium">{vocab.vocab}</span>{" "}
                    <span className="text-muted-foreground">— {vocab.meanVI}</span>
                  </span>
                </Label>
              ))}
            </div>
            <DialogFooter>
              <Button disabled={selectedVocab.length === 0} onClick={handleAssign}>
                Giao bài ({selectedVocab.length})
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{studentCount}</p>
              <p className="text-xs text-muted-foreground">Học sinh</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{averageScore}%</p>
              <p className="text-xs text-muted-foreground">Điểm trung bình</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-orange-500/10">
              <Flame className="size-4 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">
                {doneToday}/{studentCount}
              </p>
              <p className="text-xs text-muted-foreground">Hoàn thành hôm nay</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách học sinh</CardTitle>
          <CardDescription>Tiến độ học tập của {className}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {classStudents.map((student, index) => (
            <div key={student.id}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {student.todayStatus === "done" ? (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{student.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.levelName} · {student.masteredVocab} từ đã thuộc
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:w-64">
                  <Progress value={student.score} className="flex-1" />
                  <Badge variant="outline" className="gap-1 shrink-0">
                    <Flame className="size-3 text-orange-500" />
                    {student.streak}
                  </Badge>
                  <Badge
                    variant={student.todayStatus === "done" ? "default" : "outline"}
                    className="shrink-0"
                  >
                    {statusLabel[student.todayStatus]}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Nhắc nhở ${student.fullName}`}
                    onClick={() => handleRemind(student.fullName)}
                  >
                    <BellRing className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
