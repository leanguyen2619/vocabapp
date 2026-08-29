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
  Pin,
  PinOff,
  Search,
  Send,
  Shuffle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  assignVocabularyToAllStudentsAction,
  assignVocabularyToStudentAction,
  cancelAssignmentAction,
  getStudentDetailAction,
  listAllAssignedVocabAction,
  pinRandomTopicForStudentAction,
  pinTopicForStudentAction,
  setDailyWordTargetOverrideAction,
  unpinTopicForStudentAction,
  type AssignedVocabSummary,
  type StudentDetail,
  type StudentSummary,
} from "@/lib/actions/students";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Level, Topic, Vocabulary } from "@/types";

const ALL = "all";

interface KnownCredentials {
  fullName: string;
  email: string;
  password: string;
}

export function AdminStudentsPanel({
  students,
  vocabularyBank,
  assignedVocab: initialAssignedVocab,
  topics,
  levels,
  dict,
}: {
  students: StudentSummary[];
  vocabularyBank: Vocabulary[];
  assignedVocab: AssignedVocabSummary[];
  topics: Topic[];
  levels: Level[];
  dict: Dictionary;
}) {
  const [selectedVocab, setSelectedVocab] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabTopicFilter, setVocabTopicFilter] = useState(ALL);
  const [vocabLevelFilter, setVocabLevelFilter] = useState(ALL);
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

  const [pinTopicSelect, setPinTopicSelect] = useState(ALL);
  const [pinning, setPinning] = useState(false);
  const [dailyTargetInput, setDailyTargetInput] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);

  const [studentAssignTarget, setStudentAssignTarget] = useState<StudentSummary | null>(null);
  const [studentAssignVocab, setStudentAssignVocab] = useState<string[]>([]);
  const [studentAssignSearch, setStudentAssignSearch] = useState("");
  const [studentAssignTopicFilter, setStudentAssignTopicFilter] = useState(ALL);
  const [studentAssignLevelFilter, setStudentAssignLevelFilter] = useState(ALL);
  const [studentAssigning, setStudentAssigning] = useState(false);

  const studentCount = students.length;
  const averageScore =
    studentCount > 0 ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / studentCount) : 0;
  const doneToday = students.filter((s) => s.todayStatus === "done").length;

  const query = vocabSearch.trim().toLowerCase();
  const filteredVocab = vocabularyBank.filter(
    (v) =>
      (v.vocab.toLowerCase().includes(query) || v.meanVI.toLowerCase().includes(query)) &&
      (vocabTopicFilter === ALL || v.topicId === Number(vocabTopicFilter)) &&
      (vocabLevelFilter === ALL || v.levelId === vocabLevelFilter)
  );

  const studentAssignQuery = studentAssignSearch.trim().toLowerCase();
  const filteredStudentAssignVocab = vocabularyBank.filter(
    (v) =>
      (v.vocab.toLowerCase().includes(studentAssignQuery) ||
        v.meanVI.toLowerCase().includes(studentAssignQuery)) &&
      (studentAssignTopicFilter === ALL || v.topicId === Number(studentAssignTopicFilter)) &&
      (studentAssignLevelFilter === ALL || v.levelId === studentAssignLevelFilter)
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
    setStudentAssignTopicFilter(ALL);
    setStudentAssignLevelFilter(ALL);
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
    setPinTopicSelect(data?.pinnedTopicId != null ? String(data.pinnedTopicId) : ALL);
    setDailyTargetInput(data?.dailyWordTargetOverride != null ? String(data.dailyWordTargetOverride) : "");
  };

  const handlePinTopic = async () => {
    if (!detailData || pinTopicSelect === ALL) return;
    setPinning(true);
    const result = await pinTopicForStudentAction(detailData.id_login, Number(pinTopicSelect));
    setPinning(false);

    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }
    setDetailData((prev) =>
      prev ? { ...prev, pinnedTopicId: Number(pinTopicSelect), pinnedTopicName: result.topicName } : prev
    );
    toast.success(formatMessage(dict.adminStudents.pinTopicSuccess, { topic: result.topicName, name: detailData.fullName }));
  };

  const handlePinRandomTopic = async () => {
    if (!detailData) return;
    setPinning(true);
    const result = await pinRandomTopicForStudentAction(detailData.id_login);
    setPinning(false);

    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }
    setDetailData((prev) => (prev ? { ...prev, pinnedTopicName: result.topicName } : prev));
    // The action doesn't return which topic id it picked, only its name — refetch to keep the
    // topic Select's own value in sync (pinnedTopicId is otherwise stale after this call).
    const refreshed = await getStudentDetailAction(detailData.id_login);
    if (refreshed) {
      setDetailData(refreshed);
      setPinTopicSelect(refreshed.pinnedTopicId != null ? String(refreshed.pinnedTopicId) : ALL);
    }
    toast.success(
      formatMessage(dict.adminStudents.randomTopicSuccess, { topic: result.topicName, name: detailData.fullName })
    );
  };

  const handleUnpinTopic = async () => {
    if (!detailData) return;
    setPinning(true);
    const ok = await unpinTopicForStudentAction(detailData.id_login);
    setPinning(false);

    if (!ok) {
      toast.error(dict.adminStudents.pinTopicError);
      return;
    }
    setDetailData((prev) => (prev ? { ...prev, pinnedTopicId: null, pinnedTopicName: null } : prev));
    setPinTopicSelect(ALL);
    toast.success(formatMessage(dict.adminStudents.autoModeSuccess, { name: detailData.fullName }));
  };

  const handleSaveDailyTarget = async () => {
    if (!detailData) return;
    const trimmed = dailyTargetInput.trim();
    const target = trimmed === "" ? null : Number(trimmed);

    setSavingTarget(true);
    const result = await setDailyWordTargetOverrideAction(detailData.id_login, target);
    setSavingTarget(false);

    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }
    setDetailData((prev) => (prev ? { ...prev, dailyWordTargetOverride: target } : prev));
    toast.success(
      target === null
        ? formatMessage(dict.adminStudents.dailyTargetClearSuccess, { name: detailData.fullName })
        : formatMessage(dict.adminStudents.dailyTargetSuccess, { count: target, name: detailData.fullName })
    );
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
                setVocabTopicFilter(ALL);
                setVocabLevelFilter(ALL);
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

              <div className="grid grid-cols-2 gap-2">
                <Select value={vocabTopicFilter} onValueChange={(v) => setVocabTopicFilter(v ?? ALL)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        value === ALL
                          ? dict.adminStudents.allTopics
                          : (topics.find((t) => String(t.id) === value)?.topic ?? dict.adminStudents.allTopics)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{dict.adminStudents.allTopics}</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={String(topic.id)}>
                        {topic.topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={vocabLevelFilter} onValueChange={(v) => setVocabLevelFilter(v ?? ALL)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        value === ALL
                          ? dict.adminStudents.allLevels
                          : (levels.find((l) => l.id === value)?.level ?? dict.adminStudents.allLevels)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{dict.adminStudents.allLevels}</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {student.pinnedTopicName && (
                    <Badge variant="secondary" className="max-w-32 gap-1 shrink-0 truncate">
                      <Pin className="size-3" />
                      {student.pinnedTopicName}
                    </Badge>
                  )}
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
                      setStudentAssignTopicFilter(ALL);
                      setStudentAssignLevelFilter(ALL);
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
            setStudentAssignTopicFilter(ALL);
            setStudentAssignLevelFilter(ALL);
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

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={studentAssignTopicFilter}
              onValueChange={(v) => setStudentAssignTopicFilter(v ?? ALL)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string) =>
                    value === ALL
                      ? dict.adminStudents.allTopics
                      : (topics.find((t) => String(t.id) === value)?.topic ?? dict.adminStudents.allTopics)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{dict.adminStudents.allTopics}</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={String(topic.id)}>
                    {topic.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={studentAssignLevelFilter}
              onValueChange={(v) => setStudentAssignLevelFilter(v ?? ALL)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string) =>
                    value === ALL
                      ? dict.adminStudents.allLevels
                      : (levels.find((l) => l.id === value)?.level ?? dict.adminStudents.allLevels)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{dict.adminStudents.allLevels}</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Pin className="size-3.5" />
                  {dict.adminStudents.assignModeTitle}
                </div>
                <p className="text-sm text-muted-foreground">{dict.adminStudents.assignModeDesc}</p>

                {detailData.pinnedTopicName ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="max-w-48 gap-1 truncate">
                      <Pin className="size-3" />
                      {detailData.pinnedTopicName}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pinning}
                      onClick={() => void handleUnpinTopic()}
                    >
                      <PinOff className="size-3.5" />
                      {dict.adminStudents.autoModeButton}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{dict.adminStudents.assignModeAuto}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Select value={pinTopicSelect} onValueChange={(v) => setPinTopicSelect(v ?? ALL)}>
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue>
                        {(value: string) =>
                          value === ALL
                            ? dict.adminStudents.pinTopicPlaceholder
                            : (topics.find((t) => String(t.id) === value)?.topic ??
                              dict.adminStudents.pinTopicPlaceholder)
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={String(topic.id)}>
                          {topic.topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pinning || pinTopicSelect === ALL}
                    onClick={() => void handlePinTopic()}
                  >
                    <Pin className="size-3.5" />
                    {dict.adminStudents.pinTopicButton}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pinning}
                    onClick={() => void handlePinRandomTopic()}
                  >
                    <Shuffle className="size-3.5" />
                    {dict.adminStudents.randomTopicButton}
                  </Button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dailyTargetOverride">{dict.adminStudents.dailyTargetTitle}</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatMessage(dict.adminStudents.dailyTargetDesc, {
                      count: detailData.classDailyWordTarget,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dailyTargetOverride"
                      type="number"
                      min={1}
                      value={dailyTargetInput}
                      onChange={(e) => setDailyTargetInput(e.target.value)}
                      placeholder={formatMessage(dict.adminStudents.dailyTargetPlaceholder, {
                        count: detailData.classDailyWordTarget,
                      })}
                      className="w-full sm:w-40"
                    />
                    <Button variant="outline" size="sm" disabled={savingTarget} onClick={() => void handleSaveDailyTarget()}>
                      {dict.adminStudents.dailyTargetSaveButton}
                    </Button>
                  </div>
                </div>
              </div>

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
