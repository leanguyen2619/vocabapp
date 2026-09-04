"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  Check,
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
  getStudentDetailAction,
  pinRandomTopicForStudentAction,
  pinTopicForStudentAction,
  setDailyWordTargetOverrideAction,
  unpinTopicForStudentAction,
  type StudentDetail,
  type StudentSummary,
} from "@/lib/actions/students";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { shuffle } from "@/lib/utils";
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
  topics,
  levels,
  dict,
}: {
  students: StudentSummary[];
  vocabularyBank: Vocabulary[];
  topics: Topic[];
  levels: Level[];
  dict: Dictionary;
}) {
  const router = useRouter();
  const [selectedVocab, setSelectedVocab] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabTopicFilter, setVocabTopicFilter] = useState(ALL);
  const [vocabLevelFilter, setVocabLevelFilter] = useState(ALL);
  const [vocabCountInput, setVocabCountInput] = useState("");
  const [assigning, setAssigning] = useState(false);

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
  const [studentAssignCountInput, setStudentAssignCountInput] = useState("");
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

  const DEFAULT_RANDOM_COUNT = 5;
  // Above this many matches, skip rendering the picker dropdown's item list entirely — a student
  // reported it going blank in their browser specifically with large lists (500+), which never
  // reproduced in testing but the match-count text, Apply, and Random all keep working either
  // way, so there's no real loss from just not risking the list at that size.
  const LIST_DISPLAY_LIMIT = 50;

  /** Randomly picks N words from whatever the search/topic/level filters currently narrow the
   * pool down to (the full bank if none are set — "random hoàn toàn") and replaces the current
   * checkbox selection with them, so admin can still review/adjust before hitting Assign. */
  const handleRandomPick = (pool: Vocabulary[], countInput: string, setSelected: (ids: string[]) => void) => {
    const parsed = Number(countInput.trim());
    const count = countInput.trim() && Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_RANDOM_COUNT;
    const picked = shuffle(pool).slice(0, count).map((v) => v.id);
    setSelected(picked);
    if (picked.length === 0) toast.error(dict.adminStudents.noVocabFound);
  };

  /** Takes every word the search/topic/level filters currently match — in filter order, not
   * shuffled — for deliberately picking specific word(s) by name rather than a random sample.
   * "Số từ" only caps this when the admin actually typed a number; left blank, Apply takes
   * everything that matched (that's the point of narrowing the search down first). */
  const handleApplyFilter = (pool: Vocabulary[], countInput: string, setSelected: (ids: string[]) => void) => {
    const parsed = Number(countInput.trim());
    const cap = countInput.trim() && Number.isInteger(parsed) && parsed > 0 ? parsed : pool.length;
    const applied = pool.slice(0, cap).map((v) => v.id);
    setSelected(applied);
    if (applied.length === 0) toast.error(dict.adminStudents.noVocabFound);
  };

  /** Adds one specific word (picked from the search-results dropdown) to the current selection,
   * without disturbing whatever Apply/Random already put there. No-op if it's already selected. */
  const handlePickOneVocab = (vocabId: string, setSelected: (update: (current: string[]) => string[]) => void) => {
    setSelected((current) => (current.includes(vocabId) ? current : [...current, vocabId]));
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
    // Refetches listAllStudentsAction server-side so each student's assignedWords list (shown
    // inline below) reflects the new assignment right away.
    router.refresh();
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
    router.refresh();
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
                setVocabCountInput("");
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

              {filteredVocab.length > LIST_DISPLAY_LIMIT ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
                  {formatMessage(dict.adminStudents.matchCount, { count: filteredVocab.length })}{" "}
                  {dict.adminStudents.narrowSearchHint}
                </p>
              ) : (
                <Select
                  value=""
                  onValueChange={(id) => id && handlePickOneVocab(id, setSelectedVocab)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {() => formatMessage(dict.adminStudents.matchCount, { count: filteredVocab.length })}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVocab.length === 0 ? (
                      <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                        {dict.adminStudents.noVocabFound}
                      </p>
                    ) : (
                      filteredVocab.map((vocab) => (
                        <SelectItem key={vocab.id} value={vocab.id}>
                          <span className="font-medium">{vocab.vocab}</span>
                          <span className="text-muted-foreground">— {vocab.meanVI}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={vocabCountInput}
                  onChange={(e) => setVocabCountInput(e.target.value)}
                  placeholder={formatMessage(dict.adminStudents.randomCountPlaceholder, {
                    count: DEFAULT_RANDOM_COUNT,
                  })}
                  className="w-full sm:w-40"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => handleApplyFilter(filteredVocab, vocabCountInput, setSelectedVocab)}
                >
                  <Check className="size-4" />
                  {dict.adminStudents.applyFilterButton}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => handleRandomPick(filteredVocab, vocabCountInput, setSelectedVocab)}
                >
                  <Shuffle className="size-4" />
                  {dict.adminStudents.randomPickButton}
                </Button>
              </div>

              {selectedVocab.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  {dict.adminStudents.randomPickHint}
                </p>
              ) : (
                <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
                  {selectedVocab.map((id) => {
                    const vocab = vocabularyBank.find((v) => v.id === id);
                    if (!vocab) return null;
                    return (
                      <Badge key={id} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5">
                        {vocab.vocab}
                        <button
                          type="button"
                          aria-label={dict.common.delete}
                          onClick={() => toggleVocab(id)}
                          className="rounded-full p-0.5 hover:bg-foreground/10"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

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
        <Card className="bg-card/85 backdrop-blur-sm">
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
        <Card className="bg-card/85 backdrop-blur-sm">
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
        <Card className="bg-card/85 backdrop-blur-sm">
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

      <Card className="bg-card/85 backdrop-blur-sm">
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
                    {/* Every word currently assigned to this student, inline — mastered ones stand
                     * out (solid badge) from still-pending ones (outline), so it's obvious at a
                     * glance who has which word without a separate, space-hungry word-centric
                     * list (the "Đã giao gần đây" card this replaced). */}
                    {student.assignedWords.length > 0 && (
                      <div className="mt-1.5 flex max-w-full flex-wrap gap-1">
                        {student.assignedWords.map((w) => (
                          <Badge
                            key={w.vocab}
                            variant={w.mastered ? "default" : "outline"}
                            className={w.mastered ? "font-semibold" : "text-muted-foreground"}
                          >
                            {w.vocab}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:w-auto">
                  <Progress
                    value={student.score}
                    className="flex-1 sm:w-32"
                    indicatorClassName="bg-emerald-500"
                  />
                  {student.pinnedTopicName && (
                    <Badge variant="secondary" className="max-w-32 gap-1 shrink-0 truncate">
                      <Pin className="size-3" />
                      {student.pinnedTopicName}
                    </Badge>
                  )}
                  {student.assignRuleExhausted && (
                    <Badge variant="destructive" className="gap-1 shrink-0">
                      <AlertTriangle className="size-3" />
                      {dict.adminStudents.assignRuleExhaustedBadge}
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
            setStudentAssignCountInput("");
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

          {filteredStudentAssignVocab.length > LIST_DISPLAY_LIMIT ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
              {formatMessage(dict.adminStudents.matchCount, { count: filteredStudentAssignVocab.length })}{" "}
              {dict.adminStudents.narrowSearchHint}
            </p>
          ) : (
            <Select
              value=""
              onValueChange={(id) => id && handlePickOneVocab(id, setStudentAssignVocab)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {() =>
                    formatMessage(dict.adminStudents.matchCount, {
                      count: filteredStudentAssignVocab.length,
                    })
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {filteredStudentAssignVocab.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                    {dict.adminStudents.noVocabFound}
                  </p>
                ) : (
                  filteredStudentAssignVocab.map((vocab) => (
                    <SelectItem key={vocab.id} value={vocab.id}>
                      <span className="font-medium">{vocab.vocab}</span>
                      <span className="text-muted-foreground">— {vocab.meanVI}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min={1}
              value={studentAssignCountInput}
              onChange={(e) => setStudentAssignCountInput(e.target.value)}
              placeholder={formatMessage(dict.adminStudents.randomCountPlaceholder, {
                count: DEFAULT_RANDOM_COUNT,
              })}
              className="w-full sm:w-40"
            />
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() =>
                handleApplyFilter(filteredStudentAssignVocab, studentAssignCountInput, setStudentAssignVocab)
              }
            >
              <Check className="size-4" />
              {dict.adminStudents.applyFilterButton}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              onClick={() =>
                handleRandomPick(filteredStudentAssignVocab, studentAssignCountInput, setStudentAssignVocab)
              }
            >
              <Shuffle className="size-4" />
              {dict.adminStudents.randomPickButton}
            </Button>
          </div>

          {studentAssignVocab.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              {dict.adminStudents.randomPickHint}
            </p>
          ) : (
            <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
              {studentAssignVocab.map((id) => {
                const vocab = vocabularyBank.find((v) => v.id === id);
                if (!vocab) return null;
                return (
                  <Badge key={id} variant="secondary" className="gap-1 py-1 pr-1 pl-2.5">
                    {vocab.vocab}
                    <button
                      type="button"
                      aria-label={dict.common.delete}
                      onClick={() => toggleStudentAssignVocab(id)}
                      className="rounded-full p-0.5 hover:bg-foreground/10"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

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
