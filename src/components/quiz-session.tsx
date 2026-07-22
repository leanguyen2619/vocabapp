"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { cn, shuffle } from "@/lib/utils";
import type { Vocabulary } from "@/types";

interface QuizQuestion {
  vocab: Vocabulary;
  options: Vocabulary[];
}

function buildQuestions(vocabList: Vocabulary[]): QuizQuestion[] {
  return shuffle(vocabList).map((vocab) => ({
    vocab,
    options: shuffle(vocabList),
  }));
}

export function QuizSession({ vocabList }: { vocabList: Vocabulary[] }) {
  const [questions] = useState<QuizQuestion[]>(() => buildQuestions(vocabList));
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const question = questions[index];
  const isAnswered = selectedId !== null;
  const isCorrect = selectedId === question.vocab.id;

  const handleSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedId(optionId);
    if (optionId === question.vocab.id) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelectedId(null);
  };

  const handleRestart = () => {
    setIndex(0);
    setSelectedId(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Hoàn thành bài kiểm tra!
          </h2>
          <p className="text-muted-foreground">
            Bạn trả lời đúng {score}/{total} câu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            Làm lại
          </Button>
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Về Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          Câu {index + 1}/{total}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="secondary">{question.vocab.topic}</Badge>
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          Từ nào có nghĩa là &ldquo;{question.vocab.meanVI}&rdquo;?
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isThisCorrect = option.id === question.vocab.id;
          const isSelected = option.id === selectedId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={isAnswered}
              className={cn(
                "flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium transition-colors disabled:cursor-default",
                !isAnswered && "hover:border-primary/50",
                isAnswered && isThisCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                isAnswered &&
                  isSelected &&
                  !isThisCorrect &&
                  "border-red-400 bg-red-50 text-red-700"
              )}
            >
              {option.vocab}
              {isAnswered && isThisCorrect && <Check className="size-5 shrink-0 text-emerald-600" />}
              {isAnswered && isSelected && !isThisCorrect && (
                <X className="size-5 shrink-0 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isCorrect ? "Chính xác! " : "Chưa đúng — "}
            <span className="font-medium text-foreground">{question.vocab.vocab}</span>:{" "}
            {question.vocab.definition}
          </p>
          <Button onClick={handleNext}>
            {index + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}
          </Button>
        </div>
      )}
    </div>
  );
}
