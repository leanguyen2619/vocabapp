"use client";

import { useMemo, useRef, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Download,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  bulkCreateVocabularyAction,
  createVocabularyAction,
  deleteVocabularyAction,
  ensureTopicsAction,
  listVocabularyAction,
  updateVocabularyAction,
} from "@/lib/actions/vocabulary";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getLevelName, getTopicName } from "@/lib/labels";
import { normalizeImportRow, normalizePartOfSpeech, POS_VALUES } from "@/lib/vocab-import";
import { speakWord } from "@/lib/speech";
import type { Level, PartOfSpeech, Topic, Vocabulary } from "@/types";

export function AdminVocabularyClient({
  initialWords,
  levels,
  topics: initialTopics,
  dict,
}: {
  initialWords: Vocabulary[];
  levels: Level[];
  topics: Topic[];
  dict: Dictionary;
}) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const emptyForm = {
    vocab: "",
    definition: "",
    meanVI: "",
    partOfSpeech: "noun" as PartOfSpeech,
    ipa: "",
    topicId: String(topics[0]?.id ?? ""),
    levelId: levels[0]?.id ?? "",
  };

  const [words, setWords] = useState<Vocabulary[]>(initialWords);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vocabulary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import can take a few seconds for a large file (parsing + topic lookup + bulk insert), so the
  // stage text keeps the admin oriented instead of the button just silently doing nothing.
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importStage, setImportStage] = useState<string | null>(null);
  const importing = importFileName !== null;

  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("all");
  const [sortMode, setSortMode] = useState<"default" | "level">("default");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const query = search.trim().toLowerCase();
  const filteredWords = useMemo(
    () =>
      words.filter(
        (w) =>
          (w.vocab.toLowerCase().includes(query) || w.meanVI.toLowerCase().includes(query)) &&
          (topicFilter === "all" || w.topicId === Number(topicFilter))
      ),
    [words, query, topicFilter]
  );

  const sortedWords = useMemo(() => {
    if (sortMode !== "level") return filteredWords;
    const levelOrdinal = new Map(levels.map((l, i) => [l.id, i]));
    return [...filteredWords].sort(
      (a, b) => (levelOrdinal.get(a.levelId) ?? 0) - (levelOrdinal.get(b.levelId) ?? 0)
    );
  }, [filteredWords, sortMode, levels]);

  const totalPages = Math.max(1, Math.ceil(sortedWords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedWords = sortedWords.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (word: Vocabulary) => {
    setEditingId(word.id);
    setForm({
      vocab: word.vocab,
      definition: word.definition,
      meanVI: word.meanVI,
      partOfSpeech: word.partOfSpeech,
      ipa: word.ipa ?? "",
      topicId: String(word.topicId),
      levelId: word.levelId,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!form.vocab.trim() || !form.definition.trim() || !form.meanVI.trim()) {
      setError(dict.admin.vocabulary.errorFillAll);
      return;
    }

    const payload = {
      vocab: form.vocab.trim(),
      definition: form.definition.trim(),
      meanVI: form.meanVI.trim(),
      partOfSpeech: form.partOfSpeech,
      ipa: form.ipa.trim() || null,
      topicId: Number(form.topicId),
      levelId: form.levelId,
    };

    if (editingId) {
      const ok = await updateVocabularyAction(editingId, payload);
      if (!ok) {
        setError("Không thể cập nhật từ này. Chủ đề hoặc cấp độ đã chọn không hợp lệ.");
        return;
      }
      toast.success(formatMessage(dict.admin.vocabulary.updateSuccess, { word: payload.vocab }));
    } else {
      const result = await createVocabularyAction(payload);
      if (result.error !== undefined) {
        setError(result.error);
        return;
      }
      toast.success(formatMessage(dict.admin.vocabulary.addSuccess, { word: payload.vocab }));
    }

    setWords(await listVocabularyAction());
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteVocabularyAction(deleteTarget.id);
    setDeleting(false);
    if (result.error !== undefined) {
      toast.error(result.error);
      return;
    }
    setWords(await listVocabularyAction());
    toast.success(formatMessage(dict.admin.vocabulary.deleteSuccess, { word: deleteTarget.vocab }));
    setDeleteTarget(null);
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const sample = [
      {
        vocab: "example",
        definition: "a thing characteristic of its kind",
        meanVI: "ví dụ",
        partOfSpeech: "noun",
        ipa: "/ɪɡˈzɑːmpəl/",
        topic: topics[0]?.topic ?? "",
        level: levels[0]?.level ?? "",
      },
    ];
    const sheet = XLSX.utils.json_to_sheet(sample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, dict.admin.vocabulary.title);
    XLSX.writeFile(workbook, "vocabapp_mau_tu_vung.xlsx");
  };

  const handleImportFile = async (file: File) => {
    setImportFileName(file.name);
    try {
      setImportStage(formatMessage(dict.admin.vocabulary.importStageReading, { fileName: file.name }));
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const rows = rawRows.map(normalizeImportRow);

      // Any topic name the file uses that doesn't exist yet gets created on the fly — a file
      // naming a new CEFR level's own categories (e.g. the Cambridge-style "primaryTopic" column)
      // shouldn't require an admin to hand-create every topic first just to get past matching.
      const existingTopicNames = new Set(topics.map((t) => t.topic.toLowerCase()));
      const topicNamesInFile = rows
        .map((r) => r.topic?.toString().trim())
        .filter((name): name is string => Boolean(name) && !existingTopicNames.has(name!.toLowerCase()));
      let currentTopics = topics;
      if (topicNamesInFile.length > 0) {
        setImportStage(dict.admin.vocabulary.importStageTopics);
        currentTopics = await ensureTopicsAction(topicNamesInFile);
        setTopics(currentTopics);
      }

      const existingWords = new Set(words.map((w) => w.vocab.toLowerCase()));
      const seenInFile = new Set<string>();
      const validRows: Omit<Vocabulary, "id">[] = [];
      let skipped = 0;
      let duplicates = 0;

      for (const row of rows) {
        const vocab = row.vocab?.toString().trim();
        const definition = row.definition?.toString().trim();
        const meanVI = row.meanVI?.toString().trim();
        const ipa = row.ipa?.toString().trim() || null;
        const topicRaw = row.topic?.toString().trim().toLowerCase();
        const levelRaw = row.level?.toString().trim().toLowerCase();

        const pos = normalizePartOfSpeech(row.partOfSpeech);
        const topic = currentTopics.find((t) => t.topic.toLowerCase() === topicRaw);
        const level = levels.find((l) => l.level.toLowerCase() === levelRaw);

        if (!vocab || !definition || !meanVI || !pos || !topic || !level) {
          skipped += 1;
          continue;
        }

        const key = vocab.toLowerCase();
        if (existingWords.has(key) || seenInFile.has(key)) {
          duplicates += 1;
          continue;
        }
        seenInFile.add(key);

        validRows.push({
          vocab,
          definition,
          meanVI,
          partOfSpeech: pos,
          ipa,
          topicId: topic.id,
          levelId: level.id,
        });
      }

      setImportStage(dict.admin.vocabulary.importStageInserting);
      const imported = await bulkCreateVocabularyAction(validRows);

      setImportStage(dict.admin.vocabulary.importStageRefreshing);
      setWords(await listVocabularyAction());

      if (imported > 0)
        toast.success(formatMessage(dict.admin.vocabulary.importSuccess, { count: imported }));
      if (duplicates > 0)
        toast.error(formatMessage(dict.admin.vocabulary.importDuplicates, { count: duplicates }));
      if (skipped > 0)
        toast.error(formatMessage(dict.admin.vocabulary.importSkipped, { count: skipped }));
      if (imported === 0 && skipped === 0 && duplicates === 0) toast.error(dict.admin.vocabulary.importEmpty);
    } catch {
      toast.error(dict.admin.vocabulary.importError);
    } finally {
      setImportFileName(null);
      setImportStage(null);
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
              {dict.admin.vocabulary.title}
            </h1>
            <p className="text-muted-foreground">
              {formatMessage(dict.admin.vocabulary.subtitle, { count: words.length })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => void handleDownloadTemplate()}
            >
              <Download className="size-4" />
              {dict.admin.vocabulary.downloadTemplate}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {dict.admin.vocabulary.importExcel}
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
              {dict.admin.vocabulary.addWord}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={dict.admin.vocabulary.searchPlaceholder}
                className="pl-8"
              />
            </div>

            <Select
              value={topicFilter}
              onValueChange={(value) => {
                setTopicFilter(value ?? "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={dict.admin.vocabulary.topicFilterPlaceholder}>
                  {(value: string) =>
                    value === "all"
                      ? dict.admin.vocabulary.allTopics
                      : (topics.find((t) => String(t.id) === value)?.topic ??
                        dict.admin.vocabulary.topicFilterPlaceholder)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.admin.vocabulary.allTopics}</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={String(topic.id)}>
                    {topic.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">
              {dict.admin.vocabulary.sortLabel}
            </Label>
            <Select
              value={sortMode}
              onValueChange={(value) => {
                setSortMode((value as "default" | "level") ?? "default");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue>
                  {(value: "default" | "level") =>
                    value === "level" ? dict.admin.vocabulary.sortByLevel : dict.admin.vocabulary.sortDefault
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{dict.admin.vocabulary.sortDefault}</SelectItem>
                <SelectItem value="level">{dict.admin.vocabulary.sortByLevel}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            {pagedWords.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {dict.admin.vocabulary.noResults}
              </p>
            )}
            {pagedWords.map((word, index) => (
              <div key={word.id}>
                {index > 0 && <div className="my-3 h-px bg-border" />}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {word.vocab}{" "}
                      {word.ipa && (
                        <span className="font-normal text-muted-foreground">{word.ipa}</span>
                      )}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        {dict.partOfSpeech[word.partOfSpeech]}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {word.meanVI} · {word.definition}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="max-w-48 truncate">
                        {getTopicName(topics, word.topicId)}
                      </Badge>
                      <Badge variant="secondary">{getLevelName(levels, word.levelId)}</Badge>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={dict.vocabulary.playPronunciation}
                      onClick={() => speakWord(word.vocab)}
                    >
                      <Volume2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={dict.common.edit}
                      onClick={() => openEdit(word)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={dict.common.delete}
                      onClick={() => setDeleteTarget(word)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? dict.admin.vocabulary.editTitle : dict.admin.vocabulary.addTitle}
            </DialogTitle>
            <DialogDescription>
              {editingId ? dict.admin.vocabulary.editDesc : dict.admin.vocabulary.addDesc}
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
              <Label htmlFor="vocab">{dict.admin.vocabulary.wordLabel}</Label>
              <Input
                id="vocab"
                value={form.vocab}
                onChange={(e) => setForm((f) => ({ ...f, vocab: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ipa">{dict.admin.vocabulary.ipaLabel}</Label>
              <Input
                id="ipa"
                value={form.ipa}
                onChange={(e) => setForm((f) => ({ ...f, ipa: e.target.value }))}
                placeholder={dict.admin.vocabulary.ipaPlaceholder}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meanVI">{dict.admin.vocabulary.meanLabel}</Label>
              <Input
                id="meanVI"
                value={form.meanVI}
                onChange={(e) => setForm((f) => ({ ...f, meanVI: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="definition">{dict.admin.vocabulary.definitionLabel}</Label>
              <Textarea
                id="definition"
                rows={2}
                value={form.definition}
                onChange={(e) => setForm((f) => ({ ...f, definition: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>{dict.admin.vocabulary.posLabel}</Label>
                <Select
                  value={form.partOfSpeech}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, partOfSpeech: value as PartOfSpeech }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(value: PartOfSpeech) => dict.partOfSpeech[value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {POS_VALUES.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {dict.partOfSpeech[pos]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>{dict.admin.vocabulary.topicLabel}</Label>
                <Select
                  value={form.topicId}
                  onValueChange={(value) => setForm((f) => ({ ...f, topicId: value ?? f.topicId }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        topics.find((t) => String(t.id) === value)?.topic ?? dict.admin.vocabulary.chooseTopic
                      }
                    </SelectValue>
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
                <Label>{dict.admin.vocabulary.levelLabel}</Label>
                <Select
                  value={form.levelId}
                  onValueChange={(value) => setForm((f) => ({ ...f, levelId: value ?? f.levelId }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string) =>
                        levels.find((l) => l.id === value)?.level ?? dict.admin.vocabulary.chooseLevel
                      }
                    </SelectValue>
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
              <Button type="submit">
                {editingId ? dict.admin.vocabulary.saveSubmit : dict.admin.vocabulary.addSubmit}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.admin.vocabulary.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {deleteTarget && formatMessage(dict.admin.vocabulary.deleteConfirm, { word: deleteTarget.vocab })}
            </DialogDescription>
          </DialogHeader>

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

      <Dialog open={importing}>
        <DialogContent showCloseButton={false} className="sm:max-w-xs">
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/10">
              <FileSpreadsheet className="size-7 text-primary" />
              <Loader2 className="absolute -right-1 -bottom-1 size-6 animate-spin rounded-full bg-background text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-heading text-base font-semibold tracking-tight">
                {dict.admin.vocabulary.importingTitle}
              </p>
              <p className="text-sm text-muted-foreground">{importStage}</p>
            </div>
            <p className="text-xs text-muted-foreground">{dict.admin.vocabulary.importingDesc}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
