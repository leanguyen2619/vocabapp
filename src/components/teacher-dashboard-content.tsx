"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Copy,
  Flame,
  IdCard,
  KeyRound,
  Library,
  ListChecks,
  Search,
  Users,
  X,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  assignVocabularyToClassAction,
  cancelAssignmentAction,
  getStudentDetailAction,
  listMyAssignedVocabAction,
  resetStudentPasswordAction,
  updateMyClassTargetAction,
  type AssignedVocabSummary,
  type ClassStudentSummary,
  type StudentDetail,
} from "@/lib/actions/teacher";
import type { PendingResetRequest } from "@/lib/actions/password-reset-requests";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Account, Vocabulary } from "@/types";

interface KnownCredentials {
  fullName: string;
  email: string;
  password: string;
}

export function TeacherDashboardContent({
  account,
  className: assignedClassName,
  dailyWordTarget,
  students,
  vocabularyBank,
  assignedVocab: initialAssignedVocab,
  resetRequests: initialResetRequests,
  dict,
}: {
  account: Account;
  className: string | null;
  dailyWordTarget: number;
  students: ClassStudentSummary[];
  vocabularyBank: Vocabulary[];
  assignedVocab: AssignedVocabSummary[];
  resetRequests: PendingResetRequest[];
  dict: Dictionary;
}) {
  const [selectedVocab, setSelectedVocab] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vocabSearch, setVocabSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignedVocab, setAssignedVocab] = useState(initialAssignedVocab);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  // targetValue is the raw text while typing; committedTarget is the last server-confirmed
  // value. Kept separate (rather than comparing against the dailyWordTarget prop) because this
  // component never re-fetches its props after a successful save.
  const [targetValue, setTargetValue] = useState(String(dailyWordTarget));
  const [committedTarget, setCommittedTarget] = useState(dailyWordTarget);

  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [knownCredentials, setKnownCredentials] = useState<Record<string, KnownCredentials>>({});
  const [resetRequests, setResetRequests] = useState(initialResetRequests);

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
    toast.success(
      formatMessage(dict.teacherDashboard.assignSuccess, {
        count: selectedVocab.length,
        students: result.studentCount,
      })
    );
    setSelectedVocab([]);
    setAssignedVocab(await listMyAssignedVocabAction());
  };

  const handleCancel = async (entry: AssignedVocabSummary) => {
    setCancelingId(entry.vocabId);
    const ok = await cancelAssignmentAction(entry.vocabId);
    setCancelingId(null);
    if (!ok) {
      toast.error(dict.teacherDashboard.cancelError);
      return;
    }
    setAssignedVocab((prev) => prev.filter((v) => v.vocabId !== entry.vocabId));
    toast.success(formatMessage(dict.teacherDashboard.cancelSuccess, { word: entry.vocab }));
  };

  const handleTargetBlur = async () => {
    const target = Number(targetValue);
    if (!Number.isInteger(target) || target < 1) {
      setTargetValue(String(committedTarget));
      toast.error(dict.admin.classes.errorTargetInvalid);
      return;
    }
    if (target === committedTarget) {
      setTargetValue(String(committedTarget));
      return;
    }

    const ok = await updateMyClassTargetAction(target);
    if (!ok) {
      setTargetValue(String(committedTarget));
      toast.error(dict.teacherDashboard.targetUpdateError);
      return;
    }

    setCommittedTarget(target);
    setTargetValue(String(target));
    if (className) {
      toast.success(formatMessage(dict.teacherDashboard.targetUpdateSuccess, { className }));
    }
  };

  const openDetail = async (studentId: string) => {
    setDetailStudentId(studentId);
    setDetailData(null);
    setNewPassword("");
    setResetError(null);
    setDetailLoading(true);
    const data = await getStudentDetailAction(studentId);
    setDetailLoading(false);
    setDetailData(data);
  };

  const buildCredentialsText = (entry: KnownCredentials) =>
    `${entry.fullName}\n${dict.admin.accounts.emailLabel}: ${entry.email}\n${dict.admin.accounts.passwordLabel}: ${entry.password}`;

  const handleCopyCredentials = async (studentId: string) => {
    const entry = knownCredentials[studentId];
    if (!entry) return;
    try {
      await navigator.clipboard.writeText(buildCredentialsText(entry));
      toast.success(formatMessage(dict.admin.accounts.copyCredentialsSuccess, { name: entry.fullName }));
    } catch {
      toast.error(dict.admin.accounts.copyFailed);
    }
  };

  const handleResetPassword = async () => {
    if (!detailData) return;
    setResetError(null);
    setResetting(true);
    const result = await resetStudentPasswordAction(detailData.id_login, newPassword);
    setResetting(false);

    if (result.error !== undefined) {
      setResetError(result.error);
      return;
    }

    setKnownCredentials((prev) => ({
      ...prev,
      [detailData.id_login]: { fullName: detailData.fullName, email: detailData.email, password: newPassword },
    }));
    setResetRequests((prev) => prev.filter((r) => r.accountId !== detailData.id_login));
    toast.success(formatMessage(dict.teacherDashboard.resetSuccess, { name: detailData.fullName }));
    setNewPassword("");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {formatMessage(dict.teacherDashboard.greeting, { name: account.fullName })}
          </h1>
          <p className="text-muted-foreground">
            {className
              ? formatMessage(dict.teacherDashboard.overview, { className })
              : dict.teacherDashboard.noClass}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vocabulary" />}>
            <Library className="size-4" />
            {dict.teacherDashboard.myVocabulary}
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/exercises" />}>
            <ListChecks className="size-4" />
            {dict.teacherDashboard.exerciseTypes}
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
              {dict.teacherDashboard.assignVocab}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {formatMessage(dict.teacherDashboard.assignVocabTitle, { className: className ?? "" })}
                </DialogTitle>
                <DialogDescription>{dict.teacherDashboard.assignVocabDesc}</DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder={dict.teacherDashboard.searchVocab}
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
                    {dict.teacherDashboard.noVocabFound}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  disabled={selectedVocab.length === 0 || assigning}
                  onClick={() => void handleAssign()}
                >
                  {assigning
                    ? dict.teacherDashboard.assigning
                    : formatMessage(dict.teacherDashboard.assignButton, { count: selectedVocab.length })}
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
            <p className="text-muted-foreground">{dict.teacherDashboard.noClassCard}</p>
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
                  <p className="text-xs text-muted-foreground">{dict.teacherDashboard.students}</p>
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
                  <p className="text-xs text-muted-foreground">{dict.teacherDashboard.averageScore}</p>
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
                  <p className="text-xs text-muted-foreground">{dict.teacherDashboard.doneToday}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="dailyTarget" className="text-sm text-muted-foreground whitespace-nowrap">
              {dict.teacherDashboard.targetLabel}
            </Label>
            <Input
              id="dailyTarget"
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              onBlur={() => void handleTargetBlur()}
              className="w-20"
            />
          </div>

          {resetRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{dict.teacherDashboard.resetRequestsTitle}</CardTitle>
                <CardDescription>{dict.teacherDashboard.resetRequestsDesc}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1">
                {resetRequests.map((req, index) => (
                  <div key={req.id}>
                    {index > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between gap-3 py-1">
                      <div>
                        <span className="font-medium">{req.fullName}</span>{" "}
                        <span className="text-sm text-muted-foreground">— {req.email}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void openDetail(req.accountId)}
                      >
                        <KeyRound className="size-3.5" />
                        {dict.teacherDashboard.resetRequestButton}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{dict.teacherDashboard.assignedTitle}</CardTitle>
              <CardDescription>
                {formatMessage(dict.teacherDashboard.assignedDesc, { className })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {assignedVocab.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {dict.teacherDashboard.assignedEmpty}
                </p>
              )}
              {assignedVocab.map((entry, index) => (
                <div key={entry.vocabId}>
                  {index > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div>
                      <span className="font-medium">{entry.vocab}</span>{" "}
                      <span className="text-sm text-muted-foreground">— {entry.meanVI}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">
                        {formatMessage(dict.teacherDashboard.assignedStudentCount, {
                          count: entry.studentCount,
                        })}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={dict.teacherDashboard.cancelButton}
                        disabled={cancelingId === entry.vocabId}
                        onClick={() => void handleCancel(entry)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.teacherDashboard.studentList}</CardTitle>
              <CardDescription>
                {formatMessage(dict.teacherDashboard.studentListDesc, { className })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {students.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {dict.teacherDashboard.noStudents}
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
                          {student.levelName} · {student.masteredVocab} {dict.teacherDashboard.masteredWords}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:w-auto">
                      <Progress value={student.score} className="flex-1 sm:w-32" />
                      <Badge variant="outline" className="gap-1 shrink-0">
                        <Flame className="size-3 text-orange-500" />
                        {student.streak}
                      </Badge>
                      <Badge
                        variant={student.todayStatus === "done" ? "default" : "outline"}
                        className="shrink-0"
                      >
                        {dict.assignmentStatus[student.todayStatus]}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void openDetail(student.id_login)}
                      >
                        <IdCard className="size-3.5" />
                        {dict.teacherDashboard.detailButton}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={detailStudentId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailStudentId(null);
            setDetailData(null);
            setDetailLoading(false);
            setResetError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.teacherDashboard.detailTitle}</DialogTitle>
            <DialogDescription>{dict.teacherDashboard.detailDesc}</DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <p className="py-10 text-center text-sm text-muted-foreground">{dict.common.loading}</p>
          )}

          {!detailLoading && detailStudentId !== null && !detailData && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {dict.teacherDashboard.studentNotFound}
            </p>
          )}

          {detailData && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-medium">{detailData.fullName}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{detailData.levelName}</Badge>
                  <Badge variant="outline" className="gap-1">
                    <Flame className="size-3 text-orange-500" />
                    {detailData.streak}
                  </Badge>
                  <Badge variant="outline">
                    {dict.common.score}: {detailData.score}%
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">
                  {dict.vocabulary.mastered}: {detailData.masteredCount}
                </Badge>
                <Badge variant="outline">
                  {dict.vocabulary.learning}: {detailData.learningCount}
                </Badge>
                <Badge variant="secondary">
                  {dict.vocabulary.new}: {detailData.newCount}
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">{dict.teacherDashboard.learningWordsTitle}</p>
                {detailData.learningWords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{dict.teacherDashboard.noLearningWords}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detailData.learningWords.map((w) => (
                      <Badge key={w.vocab} variant="outline">
                        {w.vocab} — {w.meanVI}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {knownCredentials[detailData.id_login] && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    {dict.admin.accounts.credentialsKnownLabel}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopyCredentials(detailData.id_login)}
                  >
                    <Copy className="size-3.5" />
                    {dict.admin.accounts.copyCredentials}
                  </Button>
                </div>
              )}

              <Separator />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound className="size-3.5" />
                  {dict.teacherDashboard.resetPasswordTitle}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatMessage(dict.teacherDashboard.resetPasswordDesc, { name: detailData.fullName })}
                </p>

                {resetError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="teacherNewPassword">{dict.admin.accounts.newPasswordLabel}</Label>
                  <Input
                    id="teacherNewPassword"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={dict.register.passwordPlaceholder}
                  />
                </div>

                <DialogFooter>
                  <Button disabled={resetting} onClick={() => void handleResetPassword()}>
                    {dict.teacherDashboard.resetSubmit}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
