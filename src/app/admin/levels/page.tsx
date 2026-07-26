"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireSession } from "@/hooks/use-session";
import { listAccounts } from "@/lib/auth";
import { getAccountLevelStatus, levels, setAccountLevelStatus } from "@/lib/mock-data";
import type { AccountLevelStatus } from "@/types";

const statusLabel: Record<AccountLevelStatus, string> = {
  locked: "Khóa",
  in_progress: "Đang học",
  completed: "Hoàn thành",
};

const statusVariant: Record<AccountLevelStatus, "outline" | "default" | "secondary"> = {
  locked: "outline",
  in_progress: "secondary",
  completed: "default",
};

function loadStatuses(accountId: string): Record<string, AccountLevelStatus> {
  const map: Record<string, AccountLevelStatus> = {};
  levels.forEach((l) => {
    map[l.id] = getAccountLevelStatus(accountId, l.id);
  });
  return map;
}

export default function AdminLevelsPage() {
  const { account, status } = useRequireSession();
  const students = listAccounts().filter((a) => a.account.role === "student");
  const [selectedId, setSelectedId] = useState<string>(students[0]?.account.id_login ?? "");
  const [statusMap, setStatusMap] = useState<Record<string, AccountLevelStatus>>(() =>
    selectedId ? loadStatuses(selectedId) : {}
  );
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (status !== "authenticated" || !account) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (account.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">Chỉ quản trị viên mới có quyền truy cập trang này.</p>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Về Dashboard
        </Link>
      </div>
    );
  }

  const selectedStudent = students.find((s) => s.account.id_login === selectedId);

  const handleSelectStudent = (id: string) => {
    setSelectedId(id);
    setStatusMap(loadStatuses(id));
    setNotes({});
  };

  const handleSave = (levelId: string, levelName: string) => {
    setAccountLevelStatus(selectedId, levelId, statusMap[levelId], notes[levelId]);
    toast.success(`Đã cập nhật cấp độ ${levelName} cho ${selectedStudent?.account.fullName}.`);
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Level học viên</h1>
          <p className="text-muted-foreground">
            Chỉnh tay trạng thái mở khóa A1/A2/B1/B2 cho từng học viên.
          </p>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có học viên nào trong hệ thống.</p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Học viên</label>
              <Select value={selectedId} onValueChange={(v) => v && handleSelectStudent(v)}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.account.id_login} value={s.account.id_login}>
                      {s.account.fullName} ({s.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="flex flex-col gap-4 py-4">
                {levels.map((level, index) => {
                  const currentStatus = statusMap[level.id] ?? "locked";
                  return (
                    <div key={level.id}>
                      {index > 0 && <div className="mb-4 h-px bg-border" />}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {level.level}
                          </Badge>
                          <Badge variant={statusVariant[currentStatus]}>
                            {statusLabel[currentStatus]}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Select
                            value={currentStatus}
                            onValueChange={(value) =>
                              value &&
                              setStatusMap((m) => ({ ...m, [level.id]: value as AccountLevelStatus }))
                            }
                          >
                            <SelectTrigger size="sm" className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="locked">Khóa</SelectItem>
                              <SelectItem value="in_progress">Đang học</SelectItem>
                              <SelectItem value="completed">Hoàn thành</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Ghi chú (tuỳ chọn)"
                            value={notes[level.id] ?? ""}
                            onChange={(e) =>
                              setNotes((n) => ({ ...n, [level.id]: e.target.value }))
                            }
                            className="w-40"
                          />
                          <Button size="sm" onClick={() => handleSave(level.id, level.level)}>
                            Lưu
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
