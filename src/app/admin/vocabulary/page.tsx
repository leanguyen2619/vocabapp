"use client";

import { useRef, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Download,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRequireSession } from "@/hooks/use-session";
import { posLabel } from "@/lib/labels";
import {
  bulkCreateVocabulary,
  createVocabulary,
  deleteVocabulary,
  getLevelName,
  getTopicName,
  levels,
  topics,
  updateVocabulary,
  vocabularyBank,
} from "@/lib/mock-data";
import type { PartOfSpeech, VocabularyWithProgress } from "@/types";

const POS_VALUES: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "pronoun",
  "conjunction",
  "interjection",
];

interface ImportRow {
  vocab?: string;
  definition?: string;
  meanVI?: string;
  partOfSpeech?: string;
  topic?: string;
  level?: string;
}

const emptyForm = {
  vocab: "",
  definition: "",
  meanVI: "",
  partOfSpeech: "noun" as PartOfSpeech,
  topicId: String(topics[0]?.id ?? ""),
  levelId: levels[0]?.id ?? "",
};

export default function AdminVocabularyPage() {
  const { account, status } = useRequireSession();
  const [words, setWords] = useState<VocabularyWithProgress[]>(() => [...vocabularyBank]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (word: VocabularyWithProgress) => {
    setEditingId(word.id);
    setForm({
      vocab: word.vocab,
      definition: word.definition,
      meanVI: word.meanVI,
      partOfSpeech: word.partOfSpeech,
      topicId: String(word.topicId),
      levelId: word.levelId,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.vocab.trim() || !form.definition.trim() || !form.meanVI.trim()) {
      setError("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    const payload = {
      vocab: form.vocab.trim(),
      definition: form.definition.trim(),
      meanVI: form.meanVI.trim(),
      partOfSpeech: form.partOfSpeech,
      topicId: Number(form.topicId),
      levelId: form.levelId,
    };

    if (editingId) {
      updateVocabulary(editingId, payload);
      toast.success(`Đã cập nhật từ "${payload.vocab}".`);
    } else {
      createVocabulary(payload);
      toast.success(`Đã thêm từ "${payload.vocab}".`);
    }

    setWords([...vocabularyBank]);
    setDialogOpen(false);
  };

  const handleDelete = (word: VocabularyWithProgress) => {
    if (!window.confirm(`Xóa từ "${word.vocab}"?`)) return;
    deleteVocabulary(word.id);
    setWords([...vocabularyBank]);
    toast.success(`Đã xóa từ "${word.vocab}".`);
  };

  const handleDownloadTemplate = () => {
    const sample = [
      {
        vocab: "example",
        definition: "a thing characteristic of its kind",
        meanVI: "ví dụ",
        partOfSpeech: "noun",
        topic: topics[0]?.topic ?? "",
        level: levels[0]?.level ?? "",
      },
    ];
    const sheet = XLSX.utils.json_to_sheet(sample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Từ vựng");
    XLSX.writeFile(workbook, "vocabapp_mau_tu_vung.xlsx");
  };

  const handleImportFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet);

      const validRows: Omit<VocabularyWithProgress, "id" | "learningStatus">[] = [];
      let skipped = 0;

      for (const row of rows) {
        const vocab = row.vocab?.toString().trim();
        const definition = row.definition?.toString().trim();
        const meanVI = row.meanVI?.toString().trim();
        const posRaw = row.partOfSpeech?.toString().trim().toLowerCase();
        const topicRaw = row.topic?.toString().trim().toLowerCase();
        const levelRaw = row.level?.toString().trim().toLowerCase();

        const pos = POS_VALUES.find((p) => p === posRaw);
        const topic = topics.find((t) => t.topic.toLowerCase() === topicRaw);
        const level = levels.find((l) => l.level.toLowerCase() === levelRaw);

        if (!vocab || !definition || !meanVI || !pos || !topic || !level) {
          skipped += 1;
          continue;
        }

        validRows.push({
          vocab,
          definition,
          meanVI,
          partOfSpeech: pos,
          topicId: topic.id,
          levelId: level.id,
        });
      }

      const imported = bulkCreateVocabulary(validRows);
      setWords([...vocabularyBank]);

      if (imported > 0) toast.success(`Đã import ${imported} từ vựng.`);
      if (skipped > 0) toast.error(`Bỏ qua ${skipped} dòng do thiếu hoặc sai dữ liệu.`);
      if (imported === 0 && skipped === 0) toast.error("File không có dữ liệu.");
    } catch {
      toast.error("Không đọc được file. Vui lòng kiểm tra định dạng .xlsx.");
    }
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
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Từ vựng</h1>
            <p className="text-muted-foreground">{words.length} từ trong kho từ vựng.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="size-4" />
              Tải mẫu Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              Import Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
                e.target.value = "";
              }}
            />
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Thêm từ
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            {words.map((word, index) => (
              <div key={word.id}>
                {index > 0 && <div className="my-3 h-px bg-border" />}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {word.vocab}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {posLabel[word.partOfSpeech]}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {word.meanVI} · {word.definition}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="outline">{getTopicName(word.topicId)}</Badge>
                      <Badge variant="secondary">{getLevelName(word.levelId)}</Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="ghost" size="icon-sm" aria-label="Sửa" onClick={() => openEdit(word)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Xóa"
                      onClick={() => handleDelete(word)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Sửa từ vựng" : "Thêm từ vựng"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Cập nhật thông tin từ vựng." : "Thêm một từ mới vào kho từ vựng."}
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
              <Label htmlFor="vocab">Từ (tiếng Anh)</Label>
              <Input
                id="vocab"
                value={form.vocab}
                onChange={(e) => setForm((f) => ({ ...f, vocab: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meanVI">Nghĩa tiếng Việt</Label>
              <Input
                id="meanVI"
                value={form.meanVI}
                onChange={(e) => setForm((f) => ({ ...f, meanVI: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="definition">Định nghĩa (tiếng Anh)</Label>
              <Textarea
                id="definition"
                rows={2}
                value={form.definition}
                onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Loại từ</Label>
                <Select
                  value={form.partOfSpeech}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, partOfSpeech: value as PartOfSpeech }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POS_VALUES.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {posLabel[pos]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Chủ đề</Label>
                <Select
                  value={form.topicId}
                  onValueChange={(value) => setForm((f) => ({ ...f, topicId: value ?? f.topicId }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Cấp độ</Label>
                <Select
                  value={form.levelId}
                  onValueChange={(value) => setForm((f) => ({ ...f, levelId: value ?? f.levelId }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">{editingId ? "Lưu thay đổi" : "Thêm từ"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
