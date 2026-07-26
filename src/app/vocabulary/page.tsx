"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRequireSession } from "@/hooks/use-session";
import { posLabel } from "@/lib/labels";
import { getLevelName, getTopicName, levels, topics, vocabularyBank } from "@/lib/mock-data";
import type { LearningStatus } from "@/types";

const statusLabel: Record<LearningStatus, string> = {
  new: "Chưa học",
  learning: "Đang học",
  mastered: "Đã thuộc",
};

const statusVariant: Record<LearningStatus, "default" | "outline" | "secondary"> = {
  mastered: "default",
  learning: "outline",
  new: "secondary",
};

export default function VocabularyPage() {
  const { status } = useRequireSession();
  const [levelFilter, setLevelFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [search, setSearch] = useState("");

  if (status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const filtered = vocabularyBank.filter((v) => {
    if (levelFilter !== "all" && v.levelId !== levelFilter) return false;
    if (topicFilter !== "all" && v.topicId !== Number(topicFilter)) return false;
    if (query && !v.vocab.toLowerCase().includes(query) && !v.meanVI.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Kho từ vựng</h1>
          <p className="text-muted-foreground">
            {filtered.length}/{vocabularyBank.length} từ — lọc theo cấp độ và chủ đề.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={levelFilter} onValueChange={(value) => setLevelFilter(value as string)}>
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              {levels.map((level) => (
                <TabsTrigger key={level.id} value={level.id}>
                  {level.level}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select value={topicFilter} onValueChange={(value) => setTopicFilter(value as string)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Chủ đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chủ đề</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={String(topic.id)}>
                    {topic.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm từ vựng..."
                className="w-44 pl-8"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <Search className="size-8" />
            <p>Không tìm thấy từ vựng phù hợp.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((word) => (
              <Card key={word.id}>
                <CardContent className="flex flex-col gap-2 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold">{word.vocab}</p>
                      <p className="text-xs text-muted-foreground">{posLabel[word.partOfSpeech]}</p>
                    </div>
                    <Badge variant={statusVariant[word.learningStatus]} className="shrink-0">
                      {statusLabel[word.learningStatus]}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-foreground">{word.meanVI}</p>
                  <p className="text-sm text-muted-foreground">{word.definition}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{getTopicName(word.topicId)}</Badge>
                    <Badge variant="secondary">{getLevelName(word.levelId)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
