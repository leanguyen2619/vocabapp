"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Flame,
  Library,
  ListChecks,
  Search,
  Users,
} from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { assignVocabularyToClassAction, type ClassStudentSummary } from "@/lib/actions/teacher";
import type { Account, AssignmentStatus, Vocabulary } from "@/types";

const statusLabel: Record<AssignmentStatus, string> = {
  pending: "Chưa làm",
  in_progress: "Đang làm",
  done: "Hoàn thành",
  overdue: "Quá hạn",
};

export function TeacherDashboardContent({
  account,
  className: assignedClassName,
  students,
  vocabularyBank,
}: {
  account: Account;
  className: string | null;
  students: ClassStudentSummary[];
  vocabularyBank: Vocabulary[];
}) {
  const [selectedVocab, setSelectedVocab] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vocabSearch, setVocabSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  const className = assignedClassName ?? null;
  const studentCount = students.length;
  const averageScore =
    studentCount > 0 ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / studentCount) : 0;
  const doneToday = students.filter((s) => s.todayStatus === "done").length;

  const query = vocabSearch.trim().toLowerCase();
  const filteredVocab = vocabularyBank.filter(
    (v) => v.vocab.toLowerCase().includes(query) || v.meanVI.toLowerCase().includes(query)
  );

  const toggleVocab = (vocabId: string) => {
    setSelectedVocab((current) =>
      current.includes(vocabId) ? current.filter((id) => id !== vocabId) : [...current, vocabId]
    );
  };

  const handleAssign = async () => {
    setAssigning(true);
    const result = await assignVocabularyToClassAction(selectedVocab);
    setAssigning(false);

    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }

    setDialogOpen(false);
    toast.success(`Đã giao ${selectedVocab.length} từ vựng cho ${result.studentCount} học sinh.`);
    setSelectedVocab([]);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Chào {account.fullName}
          </h1>
          <p className="text-muted-foreground">
            {className ? `Tổng quan ${className} bạn đang phụ trách.` : "Bạn chưa được gán vào lớp nào."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vocabulary" />}>
            <Library className="size-4" />
            Kho từ vựng
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/exercises" />}>
            <ListChecks className="size-4" />
            Dạng bài tập
          </Button>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setSelectedVocab([]);
                setVocabSearch("");
              }
            }}
          >
            <DialogTrigger render={<Button size="sm" disabled={!className} />}>
              <ClipboardList className="size-4" />
              Giao từ vựng mới
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Giao từ vựng cho {className}</DialogTitle>
                <DialogDescription>Chọn từ vựng muốn giao cho toàn bộ học sinh.</DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder="Tìm từ vựng..."
                  className="pl-8"
                />
              </div>

              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
                {filteredVocab.map((vocab) => (
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
                {filteredVocab.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Không tìm thấy từ vựng phù hợp.
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  disabled={selectedVocab.length === 0 || assigning}
                  onClick={() => void handleAssign()}
                >
                  {assigning ? "Đang giao..." : `Giao bài (${selectedVocab.length})`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!className ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Users className="size-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              Bạn chưa được quản trị viên gán vào lớp nào. Liên hệ admin để bắt đầu quản lý lớp học.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
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
              {students.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Lớp này chưa có học sinh nào.
                </p>
              )}
              {students.map((student, index) => (
                <div key={student.id_login}>
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
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
