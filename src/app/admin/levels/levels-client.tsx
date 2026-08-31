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
  setLevelAutoUnlockThresholdAction,
  type AccountLevelEntry,
  type LevelUnlockCandidate,
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

function statusesFromEntries(entries: Record<string, AccountLevelEntry>): Record<string, AccountLevelStatus> {
  const result: Record<string, AccountLevelStatus> = {};
  Object.entries(entries).forEach(([levelId, entry]) => {
    result[levelId] = entry.status;
  });
  return result;
}

function notesFromEntries(entries: Record<string, AccountLevelEntry>): Record<string, string> {
  const result: Record<string, string> = {};
  Object.entries(entries).forEach(([levelId, entry]) => {
    if (entry.manualNote) result[levelId] = entry.manualNote;
  });
  return result;
}

export function AdminLevelsClient({
  students,
  levels,
  initialEntries,
  unlockCandidates,
  dict,
}: {
  students: StudentSummary[];
  levels: Level[];
  initialEntries: Record<string, AccountLevelEntry>;
  unlockCandidates: LevelUnlockCandidate[];
  dict: Dictionary;
}) {
  const [autoUnlockInputs, setAutoUnlockInputs] = useState<Record<string, string>>(
    Object.fromEntries(levels.map((l) => [l.id, l.autoUnlockNextAt !== null ? String(l.autoUnlockNextAt) : ""]))
  );
  const [savingAutoUnlock, setSavingAutoUnlock] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string>(students[0]?.id_login ?? "");
  const [statusMap, setStatusMap] = useState<Record<string, AccountLevelStatus>>(
    statusesFromEntries(initialEntries)
  );
  const [notes, setNotes] = useState<Record<string, string>>(notesFromEntries(initialEntries));
  const [studentSearch, setStudentSearch] = useState("");
  const [candidates, setCandidates] = useState<LevelUnlockCandidate[]>(unlockCandidates);

  const selectedStudent = students.find((s) => s.id_login === selectedId);

  const studentQuery = studentSearch.trim().toLowerCase();
  const filteredStudents = studentQuery
    ? students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(studentQuery) || s.email.toLowerCase().includes(studentQuery)
      )
    : students;

  const handleSelectStudent = async (id: string) => {
    setSelectedId(id);
    const entries = await getAccountLevelStatusesAction(id);
    setStatusMap(statusesFromEntries(entries));
    setNotes(notesFromEntries(entries));
  };

  const handleSave = async (levelId: string, levelName: string) => {
    const newStatus = statusMap[levelId];
    const ok = await setAccountLevelStatusAction(selectedId, levelId, newStatus, notes[levelId]);
    if (!ok) {
      toast.error(dict.admin.levels.saveError);
      return;
    }
    if (newStatus !== "locked") {
      setCandidates((prev) =>
        prev.filter((c) => !(c.accountId === selectedId && c.nextLevelId === levelId))
      );
    }
    toast.success(
      formatMessage(dict.admin.levels.saveSuccess, {
        level: levelName,
        name: selectedStudent?.fullName ?? "",
      })
    );
  };

  const handleSaveAutoUnlock = async (levelId: string, levelName: string, nextLevelName: string) => {
    const raw = (autoUnlockInputs[levelId] ?? "").trim();
    const threshold = raw === "" ? null : Number(raw);
    if (threshold !== null && (!Number.isInteger(threshold) || threshold < 1 || threshold > 100)) {
      toast.error(dict.admin.levels.autoUnlockError);
      return;
    }

    setSavingAutoUnlock(levelId);
    const ok = await setLevelAutoUnlockThresholdAction(levelId, threshold);
    setSavingAutoUnlock(null);

    if (!ok) {
      toast.error(dict.admin.levels.saveError);
      return;
    }
    toast.success(
      threshold === null
        ? formatMessage(dict.admin.levels.autoUnlockClearSuccess, { level: levelName })
        : formatMessage(dict.admin.levels.autoUnlockSuccess, {
            level: levelName,
            threshold,
            next: nextLevelName,
          })
    );
  };

  const handleViewCandidate = (accountId: string) => {
    void handleSelectStudent(accountId);
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

        <Card>
          <CardContent className="flex flex-col gap-4 py-4">
            <div>
              <p className="text-sm font-medium">{dict.admin.levels.autoUnlockTitle}</p>
              <p className="text-sm text-muted-foreground">{dict.admin.levels.autoUnlockDesc}</p>
            </div>

            {levels.map((level, index) => {
              const nextLevel = levels[index + 1];
              return (
                <div key={level.id}>
                  {index > 0 && <div className="mb-4 h-px bg-border" />}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {level.level}
                      </Badge>
                      {nextLevel && (
                        <span className="text-sm text-muted-foreground">
                          {formatMessage(dict.admin.levels.autoUnlockArrow, { next: nextLevel.level })}
                        </span>
                      )}
                    </div>

                    {nextLevel ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={autoUnlockInputs[level.id] ?? ""}
                          onChange={(e) =>
                            setAutoUnlockInputs((m) => ({ ...m, [level.id]: e.target.value }))
                          }
                          placeholder={dict.admin.levels.autoUnlockPlaceholder}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingAutoUnlock === level.id}
                          onClick={() => void handleSaveAutoUnlock(level.id, level.level, nextLevel.level)}
                        >
                          {dict.admin.levels.autoUnlockSave}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{dict.admin.levels.autoUnlockNoNext}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {candidates.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="mb-2 text-sm font-medium">{dict.admin.levels.unlockCandidatesTitle}</p>
              {candidates.map((c, index) => (
                <div key={`${c.accountId}-${c.nextLevelId}`}>
                  {index > 0 && <div className="my-2 h-px bg-border" />}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div>
                      <span className="font-medium">{c.fullName}</span>{" "}
                      <span className="text-sm text-muted-foreground">
                        —{" "}
                        {formatMessage(dict.admin.levels.unlockCandidateDesc, {
                          completed: c.completedLevelName,
                          next: c.nextLevelName,
                        })}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCandidate(c.accountId)}
                    >
                      {dict.admin.levels.unlockCandidateView}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dict.admin.levels.noStudents}</p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{dict.admin.levels.studentLabel}</label>
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={dict.admin.levels.studentSearchPlaceholder}
                className="w-full sm:w-72"
              />
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
                  {filteredStudents.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                      {dict.admin.levels.noStudentsFound}
                    </p>
                  ) : (
                    filteredStudents.map((s) => (
                      <SelectItem key={s.id_login} value={s.id_login}>
                        {s.fullName} ({s.email})
                      </SelectItem>
                    ))
                  )}
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
