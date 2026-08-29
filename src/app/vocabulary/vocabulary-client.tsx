"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search, Volume2 } from "lucide-react";

import { PaginationControls } from "@/components/pagination-controls";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getLevelName, getTopicName } from "@/lib/labels";
import { speakWord } from "@/lib/speech";
import type { Level, LearningStatus, Topic, VocabularyWithProgress } from "@/types";

const statusVariant: Record<LearningStatus, "default" | "outline" | "secondary"> = {
  mastered: "default",
  learning: "outline",
  new: "secondary",
};

export function VocabularyClient({
  myVocabulary,
  levels,
  topics,
  dict,
}: {
  myVocabulary: VocabularyWithProgress[];
  levels: Level[];
  topics: Topic[];
  dict: Dictionary;
}) {
  const [levelFilter, setLevelFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LearningStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 12;

  const masteredCount = myVocabulary.filter((v) => v.learningStatus === "mastered").length;
  const learningCount = myVocabulary.filter((v) => v.learningStatus === "learning").length;
  const newCount = myVocabulary.filter((v) => v.learningStatus === "new").length;

  const query = search.trim().toLowerCase();
  const filtered = myVocabulary.filter((v) => {
    if (levelFilter !== "all" && v.levelId !== levelFilter) return false;
    if (topicFilter !== "all" && v.topicId !== Number(topicFilter)) return false;
    if (statusFilter !== "all" && v.learningStatus !== statusFilter) return false;
    if (query && !v.vocab.toLowerCase().includes(query) && !v.meanVI.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{dict.vocabulary.title}</h1>
          <p className="text-muted-foreground">
            {formatMessage(dict.vocabulary.subtitle, {
              filtered: filtered.length,
              total: myVocabulary.length,
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="gap-1">
            {dict.vocabulary.mastered}: {masteredCount}
          </Badge>
          <Badge variant="outline" className="gap-1">
            {dict.vocabulary.learning}: {learningCount}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            {dict.vocabulary.new}: {newCount}
          </Badge>
        </div>

        <div className="flex flex-col gap-3">
          <Tabs
            value={levelFilter}
            onValueChange={(value) => {
              setLevelFilter(value as string);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">{dict.vocabulary.allLevels}</TabsTrigger>
              {levels.map((level) => (
                <TabsTrigger key={level.id} value={level.id}>
                  {level.level}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tabs
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as "all" | LearningStatus);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">{dict.vocabulary.allStatus}</TabsTrigger>
              <TabsTrigger value="mastered">{dict.vocabulary.mastered}</TabsTrigger>
              <TabsTrigger value="learning">{dict.vocabulary.review}</TabsTrigger>
              <TabsTrigger value="new">{dict.vocabulary.new}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select
              value={topicFilter}
              onValueChange={(value) => {
                setTopicFilter(value as string);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={dict.vocabulary.topicPlaceholder}>
                  {(value: string) =>
                    value === "all"
                      ? dict.vocabulary.allTopics
                      : (topics.find((t) => String(t.id) === value)?.topic ?? dict.vocabulary.topicPlaceholder)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.vocabulary.allTopics}</SelectItem>
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={dict.vocabulary.searchPlaceholder}
                className="w-44 pl-8"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            {myVocabulary.length === 0 ? (
              <>
                <BookOpen className="size-8" />
                <p>{dict.vocabulary.emptyBank}</p>
              </>
            ) : (
              <>
                <Search className="size-8" />
                <p>{dict.vocabulary.noResults}</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((word) => (
              <Card key={word.id}>
                <CardContent className="flex flex-col gap-2 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-lg font-semibold">{word.vocab}</p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={dict.vocabulary.playPronunciation}
                          onClick={() => speakWord(word.vocab)}
                        >
                          <Volume2 className="size-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {word.ipa && <>{word.ipa} · </>}
                        {dict.partOfSpeech[word.partOfSpeech]}
                      </p>
                    </div>
                    <Badge variant={statusVariant[word.learningStatus]} className="shrink-0">
                      {dict.learningStatus[word.learningStatus]}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium text-foreground">{word.meanVI}</p>
                  <p className="text-sm text-muted-foreground">{word.definition}</p>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">{getTopicName(topics, word.topicId)}</Badge>
                    <Badge variant="secondary">{getLevelName(levels, word.levelId)}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </main>
    </div>
  );
}
