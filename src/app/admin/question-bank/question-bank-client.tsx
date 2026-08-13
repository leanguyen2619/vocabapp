"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, BookOpen, Check, Pencil, Plus, Search, X } from "lucide-react";

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
  listQuestionsAction,
  setQuestionStatusAction,
  updateQuestionAction,
} from "@/lib/actions/questions";
import type { QuestionStatus, QuestionWithAnswers, Vocabulary } from "@/types";

const statusLabel: Record<QuestionStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
};

const statusVariant: Record<QuestionStatus, "default" | "outline" | "destructive"> = {
  approved: "default",
  pending: "outline",
  rejected: "destructive",
};

export function AdminQuestionBankClient({
  initialQuestions,
  vocabularyBank,
}: {
  initialQuestions: QuestionWithAnswers[];
  vocabularyBank: Vocabulary[];
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
      setError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }
    if (form.answers.some((a) => !a.trim())) {
      setError("Vui lòng điền đầy đủ 4 đáp án.");
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
      toast.success("Đã cập nhật câu hỏi.");
    } else {
      await createQuestionAction({
        vocabId: form.vocabId,
        questionText: form.questionText.trim(),
        explanation: form.explanation.trim() || undefined,
        answers,
      });
      toast.success("Đã thêm câu hỏi mới (chờ duyệt).");
    }

    setQuestions(await listQuestionsAction());
    setDialogOpen(false);
  };

  const handleSetStatus = async (q: QuestionWithAnswers, next: QuestionStatus) => {
    await setQuestionStatusAction(q.id, next);
    setQuestions(await listQuestionsAction());
    toast.success(
      next === "approved"
        ? `Đã duyệt câu hỏi.`
        : next === "rejected"
          ? `Đã từ chối câu hỏi.`
          : `Đã chuyển câu hỏi về chờ duyệt.`
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

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Question Bank</h1>
            <p className="text-muted-foreground">Thêm, chỉnh sửa và duyệt câu hỏi trắc nghiệm.</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Thêm câu hỏi
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
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Đã từ chối</TabsTrigger>
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
            placeholder="Tìm theo nội dung câu hỏi hoặc từ vựng..."
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
                      Từ: {q.vocab.vocab} ({q.vocab.meanVI})
                    </p>
                  </div>
                  <Badge variant={statusVariant[q.status]} className="shrink-0">
                    {statusLabel[q.status]}
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
                    Sửa
                  </Button>
                  {q.status !== "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => void handleSetStatus(q, "approved")}
                    >
                      <Check className="size-3.5" />
                      Duyệt
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
                      Từ chối
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Không có câu hỏi nào ở mục này.
            </p>
          )}
        </div>

        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Cập nhật nội dung và đáp án của câu hỏi."
                : "Câu hỏi mới sẽ ở trạng thái chờ duyệt."}
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
              <Label>Từ vựng</Label>
              <Select
                value={form.vocabId}
                onValueChange={(value) => setForm((f) => ({ ...f, vocabId: value ?? f.vocabId }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
              <Label htmlFor="questionText">Nội dung câu hỏi</Label>
              <Input
                id="questionText"
                value={form.questionText}
                onChange={(e) => setForm((f) => ({ ...f, questionText: e.target.value }))}
                placeholder='Từ nào có nghĩa là "..."?'
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="explanation">Giải thích (tùy chọn)</Label>
              <Textarea
                id="explanation"
                rows={2}
                value={form.explanation}
                onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>4 đáp án — chọn đáp án đúng</Label>
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
                      placeholder={`Đáp án ${i + 1}`}
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button type="submit">{editingId ? "Lưu thay đổi" : "Thêm câu hỏi"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
