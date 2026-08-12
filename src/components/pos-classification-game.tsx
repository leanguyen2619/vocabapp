"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { getTopicName, posLabel } from "@/lib/labels";
import { cn, shuffle } from "@/lib/utils";
import type { PartOfSpeech, Topic, Vocabulary } from "@/types";

const POS_OPTIONS: PartOfSpeech[] = ["noun", "verb", "adjective", "adverb"];
const QUESTION_COUNT = 8;

interface PosQuestion {
  vocab: Vocabulary;
  options: PartOfSpeech[];
}

function buildQuestions(bank: Vocabulary[]): PosQuestion[] {
  return shuffle(bank)
    .slice(0, QUESTION_COUNT)
    .map((vocab) => ({ vocab, options: shuffle(POS_OPTIONS) }));
}

export function PosClassificationGame({ bank, topics }: { bank: Vocabulary[]; topics: Topic[] }) {
  const [questions] = useState<PosQuestion[]>(() => buildQuestions(bank));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<PartOfSpeech | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const question = questions[index];
  const isAnswered = selected !== null;
  const isCorrect = selected === question.vocab.partOfSpeech;

  const handleSelect = (option: PartOfSpeech) => {
    if (isAnswered) return;
    setSelected(option);
    if (option === question.vocab.partOfSpeech) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const handleRestart = () => {
    setIndex(0);
    setSelected(null);
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
            Hoàn thành bài tập!
          </h2>
          <p className="text-muted-foreground">
            Bạn phân loại đúng {score}/{total} từ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            Làm lại
          </Button>
          <Button nativeButton={false} render={<Link href="/exercises" />}>
            Chọn dạng khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          Từ {index + 1}/{total}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="secondary">{getTopicName(topics, question.vocab.topicId)}</Badge>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {question.vocab.vocab}
        </h2>
        <p className="text-sm text-muted-foreground">{question.vocab.definition}</p>
        <p className="text-base font-medium">Từ này thuộc loại từ nào?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isThisCorrect = option === question.vocab.partOfSpeech;
          const isSelected = option === selected;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
              className={cn(
                "flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium capitalize transition-colors disabled:cursor-default",
                !isAnswered && "hover:border-primary/50",
                isAnswered && isThisCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                isAnswered &&
                  isSelected &&
                  !isThisCorrect &&
                  "border-red-400 bg-red-50 text-red-700"
              )}
            >
              {posLabel[option]}
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
            {isCorrect ? "Chính xác!" : "Chưa đúng."} &ldquo;{question.vocab.vocab}&rdquo; là{" "}
            <span className="font-medium text-foreground">
              {posLabel[question.vocab.partOfSpeech]}
            </span>
            .
          </p>
          <Button onClick={handleNext}>{index + 1 >= total ? "Xem kết quả" : "Câu tiếp theo"}</Button>
        </div>
      )}
    </div>
  );
}
