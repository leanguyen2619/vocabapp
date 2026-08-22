"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptByWordAction } from "@/lib/actions/progress";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import type { FillBlankQuestion } from "@/lib/mock-data";
import { cn, shuffle } from "@/lib/utils";

interface PreparedQuestion extends FillBlankQuestion {
  shuffledOptions: string[];
}

function prepare(questions: FillBlankQuestion[]): PreparedQuestion[] {
  return shuffle(questions).map((q) => ({ ...q, shuffledOptions: shuffle(q.options) }));
}

export function FillBlankGame({
  questions,
  dict,
}: {
  questions: FillBlankQuestion[];
  dict: Dictionary;
}) {
  const [prepared] = useState<PreparedQuestion[]>(() => prepare(questions));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = prepared.length;
  const question = prepared[index];
  const isAnswered = selected !== null;
  const isCorrect = selected === question.correctAnswer;
  const [before, after] = question.sentence.split("___");

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    const correct = option === question.correctAnswer;
    if (correct) {
      setScore((s) => s + 1);
    }
    void recordVocabAttemptByWordAction(question.correctAnswer, correct);
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
            {dict.fillBlankGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.fillBlankGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.fillBlankGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href="/exercises" />}>
            {dict.fillBlankGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.fillBlankGame.questionCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg leading-relaxed">
          {before}
          <span
            className={cn(
              "mx-1 inline-block min-w-16 rounded-md border-b-2 border-dashed border-primary/60 px-1 text-center font-semibold",
              isAnswered && isCorrect && "border-emerald-500 text-emerald-700",
              isAnswered && !isCorrect && "border-red-400 text-red-700"
            )}
          >
            {selected ?? "___"}
          </span>
          {after}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatMessage(dict.fillBlankGame.hint, { mean: question.meanVI })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.shuffledOptions.map((option) => {
          const isThisCorrect = option === question.correctAnswer;
          const isSelected = option === selected;

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
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
              {option}
              {isAnswered && isThisCorrect && <Check className="size-5 shrink-0 text-emerald-600" />}
              {isAnswered && isSelected && !isThisCorrect && (
                <X className="size-5 shrink-0 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="flex justify-center">
          <Button onClick={handleNext}>
            {index + 1 >= total ? dict.fillBlankGame.viewResults : dict.fillBlankGame.nextQuestion}
          </Button>
        </div>
      )}
    </div>
  );
}
