"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import type { SynonymAntonymItem } from "@/lib/actions/practice-content";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn, shuffle } from "@/lib/utils";

export function SynonymAntonymGame({
  questions,
  dict,
}: {
  questions: SynonymAntonymItem[];
  dict: Dictionary;
}) {
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
        <p>{dict.synonymAntonymGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href="/exercises" />}>
          {dict.synonymAntonymGame.changeType}
        </Button>
      </div>
    );
  }

  const question = prepared[index];
  const isAnswered = selectedId !== null;
  const isCorrect = selectedId === question.correctOptionId;
  const correctOption = question.options.find((o) => o.id === question.correctOptionId)!;

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
            {dict.synonymAntonymGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.synonymAntonymGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.synonymAntonymGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href="/exercises" />}>
            {dict.synonymAntonymGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.synonymAntonymGame.questionCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="secondary">
          {question.word} — {question.meanVI}
        </Badge>
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {question.questionText}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isCorrect
              ? dict.synonymAntonymGame.feedbackCorrect
              : formatMessage(dict.synonymAntonymGame.feedbackWrong, { answer: correctOption.text })}
          </p>
          <Button onClick={handleNext}>
            {index + 1 >= total
              ? dict.synonymAntonymGame.viewResults
              : dict.synonymAntonymGame.nextQuestion}
          </Button>
        </div>
      )}
    </div>
  );
}
