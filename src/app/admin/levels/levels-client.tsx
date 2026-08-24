"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, BookOpen } from "lucide-react";

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
import {
  getAccountLevelStatusesAction,
  setAccountLevelStatusAction,
  type StudentSummary,
} from "@/lib/actions/levels";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { AccountLevelStatus, Level } from "@/types";

const statusVariant: Record<AccountLevelStatus, "outline" | "default" | "secondary"> = {
  locked: "outline",
  in_progress: "secondary",
  completed: "default",
};

export function AdminLevelsClient({
  students,
  levels,
  initialStatusMap,
  dict,
}: {
  students: StudentSummary[];
  levels: Level[];
  initialStatusMap: Record<string, AccountLevelStatus>;
  dict: Dictionary;
}) {
  const [selectedId, setSelectedId] = useState<string>(students[0]?.id_login ?? "");
  const [statusMap, setStatusMap] = useState<Record<string, AccountLevelStatus>>(initialStatusMap);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const selectedStudent = students.find((s) => s.id_login === selectedId);

  const handleSelectStudent = async (id: string) => {
    setSelectedId(id);
    setStatusMap(await getAccountLevelStatusesAction(id));
    setNotes({});
  };

  const handleSave = async (levelId: string, levelName: string) => {
    const ok = await setAccountLevelStatusAction(selectedId, levelId, statusMap[levelId], notes[levelId]);
    if (!ok) {
      toast.error(dict.admin.levels.saveError);
      return;
    }
    toast.success(
      formatMessage(dict.admin.levels.saveSuccess, {
        level: levelName,
        name: selectedStudent?.fullName ?? "",
      })
    );
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
            {dict.common.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {dict.admin.levels.title}
          </h1>
          <p className="text-muted-foreground">{dict.admin.levels.subtitle}</p>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.admin.levels.noStudents}</p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{dict.admin.levels.studentLabel}</label>
              <Select value={selectedId} onValueChange={(v) => v && void handleSelectStudent(v)}>
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue>
                    {(value: string) => {
                      const s = students.find((s) => s.id_login === value);
                      return s ? `${s.fullName} (${s.email})` : dict.admin.levels.chooseStudent;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id_login} value={s.id_login}>
                      {s.fullName} ({s.email})
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
                            {dict.levelStatus[currentStatus]}
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
                              <SelectValue>
                                {(value: AccountLevelStatus) => dict.levelStatus[value]}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="locked">{dict.levelStatus.locked}</SelectItem>
                              <SelectItem value="in_progress">{dict.levelStatus.in_progress}</SelectItem>
                              <SelectItem value="completed">{dict.levelStatus.completed}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder={dict.admin.levels.noteLabel}
                            value={notes[level.id] ?? ""}
                            onChange={(e) =>
                              setNotes((n) => ({ ...n, [level.id]: e.target.value }))
                            }
                            className="w-40"
                          />
                          <Button size="sm" onClick={() => void handleSave(level.id, level.level)}>
                            {dict.admin.levels.save}
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
