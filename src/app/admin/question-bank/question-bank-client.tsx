"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, BookOpen, Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { PaginationControls } from "@/components/pagination-controls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createQuestionAction,
  deleteQuestionAction,
  listQuestionsAction,
  setQuestionStatusAction,
  updateQuestionAction,
} from "@/lib/actions/questions";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { QuestionStatus, QuestionWithAnswers, Vocabulary } from "@/types";

const statusVariant: Record<QuestionStatus, "default" | "outline" | "destructive"> = {
  approved: "default",
  pending: "outline",
  rejected: "destructive",
};

export function AdminQuestionBankClient({
  initialQuestions,
  vocabularyBank,
  dict,
}: {
  initialQuestions: QuestionWithAnswers[];
  vocabularyBank: Vocabulary[];
  dict: Dictionary;
}) {
  const emptyForm = {
    vocabId: vocabularyBank[0]?.id ?? "",
    questionText: "",
    explanation: "",
    answers: ["", "", "", ""],
    correctIndex: "0",
  };

  const [questions, setQuestions] = useState<QuestionWithAnswers[]>(initialQuestions);
  const [filter, setFilter] = useState<"all" | QuestionStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<QuestionWithAnswers | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const PAGE_SIZE = 10;
  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    const byStatus = filter === "all" ? questions : questions.filter((q) => q.status === filter);
    if (!query) return byStatus;
    return byStatus.filter(
      (q) =>
        q.questionText.toLowerCase().includes(query) ||
        q.vocab.vocab.toLowerCase().includes(query) ||
        q.vocab.meanVI.toLowerCase().includes(query)
    );
  }, [questions, filter, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedQuestions = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (q: QuestionWithAnswers) => {
    setEditingId(q.id);
    setForm({
      vocabId: q.vocabId,
      questionText: q.questionText,
      explanation: q.explanation ?? "",
      answers: q.answers.map((a) => a.ansText),
      correctIndex: String(q.answers.findIndex((a) => a.isCorrect)),
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.questionText.trim()) {
      setError(dict.admin.questionBank.errorQuestionRequired);
      return;
    }
    if (form.answers.some((a) => !a.trim())) {
      setError(dict.admin.questionBank.errorAnswersRequired);
      return;
    }

    const answers = form.answers.map((ansText, i) => ({
      ansText: ansText.trim(),
      isCorrect: i === Number(form.correctIndex),
    }));

    if (editingId) {
      await updateQuestionAction(editingId, {
        vocabId: form.vocabId,
        questionText: form.questionText.trim(),
        explanation: form.explanation.trim() || undefined,
        answers,
      });
      toast.success(dict.admin.questionBank.updateSuccess);
    } else {
      await createQuestionAction({
        vocabId: form.vocabId,
        questionText: form.questionText.trim(),
        explanation: form.explanation.trim() || undefined,
        answers,
      });
      toast.success(dict.admin.questionBank.addSuccess);
    }

    setQuestions(await listQuestionsAction());
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteQuestionAction(deleteTarget.id);
    setDeleting(false);

    if (result.error !== undefined) {
      setDeleteError(result.error);
      return;
    }

    setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
    toast.success(dict.admin.questionBank.deleteSuccess);
    setDeleteTarget(null);
  };

  const handleSetStatus = async (q: QuestionWithAnswers, next: QuestionStatus) => {
    await setQuestionStatusAction(q.id, next);
    setQuestions(await listQuestionsAction());
    toast.success(
      next === "approved"
        ? dict.admin.questionBank.approveSuccess
        : next === "rejected"
          ? dict.admin.questionBank.rejectSuccess
          : dict.admin.questionBank.pendingSuccess
    );
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {dict.admin.questionBank.title}
            </h1>
            <p className="text-muted-foreground">{dict.admin.questionBank.subtitle}</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            {dict.admin.questionBank.addQuestion}
          </Button>
        </div>

        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value as typeof filter);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">{dict.admin.questionBank.all}</TabsTrigger>
            <TabsTrigger value="pending">{dict.admin.questionBank.pending}</TabsTrigger>
            <TabsTrigger value="approved">{dict.admin.questionBank.approved}</TabsTrigger>
            <TabsTrigger value="rejected">{dict.admin.questionBank.rejected}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={dict.admin.questionBank.searchPlaceholder}
            className="pl-8"
          />
        </div>

        <div className="flex flex-col gap-4">
          {pagedQuestions.map((q) => (
            <Card key={q.id}>
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{q.questionText}</p>
                    <p className="text-xs text-muted-foreground">
                      {dict.admin.questionBank.wordLabel} {q.vocab.vocab} ({q.vocab.meanVI})
                    </p>
                  </div>
                  <Badge variant={statusVariant[q.status]} className="shrink-0">
                    {dict.admin.questionBank[q.status]}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {q.answers.map((a) => (
                    <div
                      key={a.ansId}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        a.isCorrect
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {a.ansText}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(q)}>
                    <Pencil className="size-3.5" />
                    {dict.admin.questionBank.edit}
                  </Button>
                  {q.status !== "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => void handleSetStatus(q, "approved")}
                    >
                      <Check className="size-3.5" />
                      {dict.admin.questionBank.approve}
                    </Button>
                  )}
                  {q.status !== "rejected" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => void handleSetStatus(q, "rejected")}
                    >
                      <X className="size-3.5" />
                      {dict.admin.questionBank.reject}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget(q);
                      setDeleteError(null);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    {dict.common.delete}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {dict.admin.questionBank.noneInFilter}
            </p>
          )}
        </div>

        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? dict.admin.questionBank.editTitle : dict.admin.questionBank.addTitle}
            </DialogTitle>
            <DialogDescription>
              {editingId ? dict.admin.questionBank.editDesc : dict.admin.questionBank.addDesc}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>{dict.admin.questionBank.vocabLabel}</Label>
              <Select
                value={form.vocabId}
                onValueChange={(value) => setForm((f) => ({ ...f, vocabId: value ?? f.vocabId }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => {
                      const v = vocabularyBank.find((v) => v.id === value);
                      return v ? `${v.vocab} — ${v.meanVI}` : dict.admin.questionBank.chooseVocab;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vocabularyBank.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vocab} — {v.meanVI}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="questionText">{dict.admin.questionBank.questionTextLabel}</Label>
              <Input
                id="questionText"
                value={form.questionText}
                onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
                placeholder={dict.admin.questionBank.questionTextPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="explanation">{dict.admin.questionBank.explanationLabel}</Label>
              <Textarea
                id="explanation"
                rows={2}
                value={form.explanation}
                onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{dict.admin.questionBank.answersLabel}</Label>
              <RadioGroup
                value={form.correctIndex}
                onValueChange={(value) => setForm((f) => ({ ...f, correctIndex: value ?? "0" }))}
                className="flex flex-col gap-2"
              >
                {form.answers.map((ansText, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <RadioGroupItem value={String(i)} />
                    <Input
                      value={ansText}
                      onChange={(e) =>
                        setForm((f) => {
                          const answers = [...f.answers];
                          answers[i] = e.target.value;
                          return { ...f, answers };
                        })
                      }
                      placeholder={formatMessage(dict.admin.questionBank.answerPlaceholder, { n: i + 1 })}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="submit">
                {editingId ? dict.admin.questionBank.saveSubmit : dict.admin.questionBank.addSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.admin.questionBank.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>{dict.admin.questionBank.deleteConfirmDesc}</DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {dict.common.cancel}
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {dict.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
