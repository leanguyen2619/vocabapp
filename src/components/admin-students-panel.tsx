"use client";

import { useRef, useState } from "react";
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
  Send,
  X,
} from "lucide-react";

import { resetPasswordByAdminAction } from "@/lib/actions/accounts";
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
  assignVocabularyToAllStudentsAction,
  assignVocabularyToStudentAction,
  cancelAssignmentAction,
  getStudentDetailAction,
  listAllAssignedVocabAction,
  type AssignedVocabSummary,
  type StudentDetail,
  type StudentSummary,
} from "@/lib/actions/students";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Vocabulary } from "@/types";

interface KnownCredentials {
  fullName: string;
  email: string;
  password: string;
}

export function AdminStudentsPanel({
  students,
  vocabularyBank,
  assignedVocab: initialAssignedVocab,
  dict,
}: {
  students: StudentSummary[];
  vocabularyBank: Vocabulary[];
  assignedVocab: AssignedVocabSummary[];
  dict: Dictionary;
}) {
  const [selectedVocab, setSelectedVocab] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vocabSearch, setVocabSearch] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignedVocab, setAssignedVocab] = useState(initialAssignedVocab);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [knownCredentials, setKnownCredentials] = useState<Record<string, KnownCredentials>>({});
  // Tracks the most recently requested student so an in-flight fetch that resolves late (out of
  // order, e.g. after a second "Chi tiết" click) can't overwrite the currently-open dialog with
  // the wrong student's data.
  const detailRequestId = useRef<string | null>(null);

  const [studentAssignTarget, setStudentAssignTarget] = useState<StudentSummary | null>(null);
  const [studentAssignVocab, setStudentAssignVocab] = useState<string[]>([]);
  const [studentAssignSearch, setStudentAssignSearch] = useState("");
  const [studentAssigning, setStudentAssigning] = useState(false);

  const studentCount = students.length;
  const averageScore =
    studentCount > 0 ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / studentCount) : 0;
  const doneToday = students.filter((s) => s.todayStatus === "done").length;

  const query = vocabSearch.trim().toLowerCase();
  const filteredVocab = vocabularyBank.filter(
    (v) => v.vocab.toLowerCase().includes(query) || v.meanVI.toLowerCase().includes(query)
  );

  const studentAssignQuery = studentAssignSearch.trim().toLowerCase();
  const filteredStudentAssignVocab = vocabularyBank.filter(
    (v) =>
      v.vocab.toLowerCase().includes(studentAssignQuery) ||
      v.meanVI.toLowerCase().includes(studentAssignQuery)
  );

  const toggleVocab = (vocabId: string) => {
    setSelectedVocab((current) =>
      current.includes(vocabId) ? current.filter((id) => id !== vocabId) : [...current, vocabId]
    );
  };

  const toggleStudentAssignVocab = (vocabId: string) => {
    setStudentAssignVocab((current) =>
      current.includes(vocabId) ? current.filter((id) => id !== vocabId) : [...current, vocabId]
    );
  };

  const handleAssign = async () => {
    setAssigning(true);
    const result = await assignVocabularyToAllStudentsAction(selectedVocab);
    setAssigning(false);

    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }

    setDialogOpen(false);
    toast.success(
      formatMessage(dict.adminStudents.assignSuccess, {
        count: selectedVocab.length,
        students: result.studentCount,
      })
    );
    setSelectedVocab([]);
    setAssignedVocab(await listAllAssignedVocabAction());
  };

  const handleAssignToStudent = async () => {
    if (!studentAssignTarget) return;
    setStudentAssigning(true);
    const result = await assignVocabularyToStudentAction(studentAssignTarget.id_login, studentAssignVocab);
    setStudentAssigning(false);

    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }

    toast.success(
      formatMessage(dict.adminStudents.assignToStudentSuccess, {
        count: studentAssignVocab.length,
        name: studentAssignTarget.fullName,
      })
    );
    setStudentAssignTarget(null);
    setStudentAssignVocab([]);
    setStudentAssignSearch("");
    setAssignedVocab(await listAllAssignedVocabAction());
  };

  const handleCancel = async (entry: AssignedVocabSummary) => {
    setCancelingId(entry.vocabId);
    const ok = await cancelAssignmentAction(entry.vocabId);
    setCancelingId(null);
    if (!ok) {
      toast.error(dict.adminStudents.cancelError);
      return;
    }
    setAssignedVocab((prev) => prev.filter((v) => v.vocabId !== entry.vocabId));
    toast.success(formatMessage(dict.adminStudents.cancelSuccess, { word: entry.vocab }));
  };

  const openDetail = async (studentId: string) => {
    detailRequestId.current = studentId;
    setDetailStudentId(studentId);
    setDetailData(null);
    setNewPassword("");
    setResetError(null);
    setDetailLoading(true);
    const data = await getStudentDetailAction(studentId);
    if (detailRequestId.current !== studentId) return;
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
    const result = await resetPasswordByAdminAction(detailData.id_login, newPassword);
    setResetting(false);

    if (result.error !== undefined) {
      setResetError(result.error);
      return;
    }

    setKnownCredentials((prev) => ({
      ...prev,
      [detailData.id_login]: { fullName: detailData.fullName, email: detailData.email, password: newPassword },
    }));
    toast.success(formatMessage(dict.adminStudents.resetSuccess, { name: detailData.fullName }));
    setNewPassword("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{dict.adminStudents.title}</h2>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vocabulary" />}>
            <Library className="size-4" />
            {dict.adminStudents.myVocabulary}
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/exercises" />}>
            <ListChecks className="size-4" />
            {dict.adminStudents.exerciseTypes}
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
            <DialogTrigger render={<Button size="sm" />}>
              <ClipboardList className="size-4" />
              {dict.adminStudents.assignVocab}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dict.adminStudents.assignVocabTitle}</DialogTitle>
                <DialogDescription>{dict.adminStudents.assignVocabDesc}</DialogDescription>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder={dict.adminStudents.searchVocab}
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
                    {dict.adminStudents.noVocabFound}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  disabled={selectedVocab.length === 0 || assigning}
                  onClick={() => void handleAssign()}
                >
                  {assigning
                    ? dict.adminStudents.assigning
                    : formatMessage(dict.adminStudents.assignButton, { count: selectedVocab.length })}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
              <IdCard className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-none">{studentCount}</p>
              <p className="text-xs text-muted-foreground">{dict.adminStudents.students}</p>
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
              <p className="text-xs text-muted-foreground">{dict.adminStudents.averageScore}</p>
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
              <p className="text-xs text-muted-foreground">{dict.adminStudents.doneToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dict.adminStudents.assignedTitle}</CardTitle>
          <CardDescription>{dict.adminStudents.assignedDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {assignedVocab.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {dict.adminStudents.assignedEmpty}
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
                    {formatMessage(dict.adminStudents.assignedStudentCount, {
                      count: entry.studentCount,
                    })}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.adminStudents.cancelButton}
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
          <CardTitle>{dict.adminStudents.studentList}</CardTitle>
          <CardDescription>{dict.adminStudents.studentListDesc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {students.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{dict.adminStudents.noStudents}</p>
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
                      {student.className ?? dict.adminStudents.noClassLabel} · {student.levelName} ·{" "}
                      {student.masteredVocab} {dict.adminStudents.masteredWords}
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
                    onClick={() => {
                      setStudentAssignTarget(student);
                      setStudentAssignVocab([]);
                      setStudentAssignSearch("");
                    }}
                  >
                    <Send className="size-3.5" />
                    {dict.adminStudents.assignToStudentButton}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void openDetail(student.id_login)}>
                    <IdCard className="size-3.5" />
                    {dict.adminStudents.detailButton}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={studentAssignTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setStudentAssignTarget(null);
            setStudentAssignVocab([]);
            setStudentAssignSearch("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formatMessage(dict.adminStudents.assignToStudentTitle, {
                name: studentAssignTarget?.fullName ?? "",
              })}
            </DialogTitle>
            <DialogDescription>{dict.adminStudents.assignToStudentDesc}</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={studentAssignSearch}
              onChange={(e) => setStudentAssignSearch(e.target.value)}
              placeholder={dict.adminStudents.searchVocab}
              className="pl-8"
            />
          </div>

          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {filteredStudentAssignVocab.map((vocab) => (
              <Label
                key={vocab.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
              >
                <Checkbox
                  checked={studentAssignVocab.includes(vocab.id)}
                  onCheckedChange={() => toggleStudentAssignVocab(vocab.id)}
                />
                <span className="flex-1">
                  <span className="font-medium">{vocab.vocab}</span>{" "}
                  <span className="text-muted-foreground">— {vocab.meanVI}</span>
                </span>
              </Label>
            ))}
            {filteredStudentAssignVocab.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {dict.adminStudents.noVocabFound}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              disabled={studentAssignVocab.length === 0 || studentAssigning}
              onClick={() => void handleAssignToStudent()}
            >
              {studentAssigning
                ? dict.adminStudents.assigning
                : formatMessage(dict.adminStudents.assignButton, { count: studentAssignVocab.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailStudentId !== null}
        onOpenChange={(open) => {
          if (!open) {
            detailRequestId.current = null;
            setDetailStudentId(null);
            setDetailData(null);
            setDetailLoading(false);
            setResetError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.adminStudents.detailTitle}</DialogTitle>
            <DialogDescription>{dict.adminStudents.detailDesc}</DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <p className="py-10 text-center text-sm text-muted-foreground">{dict.common.loading}</p>
          )}

          {!detailLoading && detailStudentId !== null && !detailData && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {dict.adminStudents.studentNotFound}
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
                <p className="text-sm font-medium">{dict.adminStudents.learningWordsTitle}</p>
                {detailData.learningWords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{dict.adminStudents.noLearningWords}</p>
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
                  {dict.adminStudents.resetPasswordTitle}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatMessage(dict.adminStudents.resetPasswordDesc, { name: detailData.fullName })}
                </p>

                {resetError && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{resetError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="adminStudentNewPassword">{dict.admin.accounts.newPasswordLabel}</Label>
                  <Input
                    id="adminStudentNewPassword"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={dict.admin.accounts.passwordPlaceholder}
                  />
                </div>

                <DialogFooter>
                  <Button disabled={resetting} onClick={() => void handleResetPassword()}>
                    {dict.adminStudents.resetSubmit}
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
