"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import type { FillBlankItem } from "@/lib/actions/practice-content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn, shuffle } from "@/lib/utils";

export function FillBlankGame({ questions, dict }: { questions: FillBlankItem[]; dict: Dictionary }) {
  const [prepared] = useState(() =>
    shuffle(questions).map((q) => ({ ...q, options: shuffle(q.options) }))
  );
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = prepared.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.fillBlankGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href="/exercises" />}>
          {dict.fillBlankGame.changeType}
        </Button>
      </div>
    );
  }

  const question = prepared[index];
  const isAnswered = selectedId !== null;
  const isCorrect = selectedId === question.correctOptionId;
  const [before, after] = question.sentence.split("___");
  const selectedText = question.options.find((o) => o.id === selectedId)?.text;

  const handleSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedId(optionId);
    const correct = optionId === question.correctOptionId;
    if (correct) {
      setScore((s) => s + 1);
    }
    void recordVocabAttemptAction(question.vocabId, correct);
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
            {selectedText ?? "___"}
          </span>
          {after}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatMessage(dict.fillBlankGame.hint, { mean: question.meanVI })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isThisCorrect = option.id === question.correctOptionId;
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
              {option.text}
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
