"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { submitSynonymAntonymAnswerAction } from "@/lib/actions/practice-content";
import type { SynonymAntonymItem } from "@/lib/actions/practice-content";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn, shuffle } from "@/lib/utils";
import type { PracticeTypeCode } from "@/types";

export function SynonymAntonymGame({
  questions,
  dict,
  warmupCode,
}: {
  questions: SynonymAntonymItem[];
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [prepared] = useState(() =>
    shuffle(questions).map((q) => ({ ...q, options: shuffle(q.options) }))
  );
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctOptionId: string } | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = prepared.length;

  useEffect(() => {
    if (finished && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.synonymAntonymGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.synonymAntonymGame.changeType}
        </Button>
      </div>
    );
  }

  const question = prepared[index];
  const isAnswered = selectedId !== null;
  const isCorrect = result?.isCorrect ?? false;
  const correctOption = result ? question.options.find((o) => o.id === result.correctOptionId) : undefined;

  const handleSelect = async (optionId: string) => {
    if (isAnswered) return;
    setSelectedId(optionId);
    const outcome = await submitSynonymAntonymAnswerAction(question.id, optionId);
    if ("error" in outcome) {
      setSelectedId(null);
      return;
    }
    setResult(outcome);
    if (outcome.isCorrect) {
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
    setResult(null);
  };

  const handleRestart = () => {
    setIndex(0);
    setSelectedId(null);
    setResult(null);
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
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.synonymAntonymGame.changeType}
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
          const isThisCorrect = option.id === result?.correctOptionId;
          const isSelected = option.id === selectedId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => void handleSelect(option.id)}
              disabled={isAnswered}
              className={cn(
                "flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium transition-colors disabled:cursor-default",
                !isAnswered && "hover:border-primary/50",
                result !== null && isThisCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                result !== null &&
                  isSelected &&
                  !isThisCorrect &&
                  "border-red-400 bg-red-50 text-red-700"
              )}
            >
              {option.text}
              {result !== null && isThisCorrect && <Check className="size-5 shrink-0 text-emerald-600" />}
              {result !== null && isSelected && !isThisCorrect && (
                <X className="size-5 shrink-0 text-red-500" />
              )}
            </button>
          );
        })}
      </div>

      {result !== null && correctOption && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isCorrect
              ? dict.synonymAntonymGame.feedbackCorrect
              : formatMessage(dict.synonymAntonymGame.feedbackWrong, { answer: correctOption.text })}
            <span className="block">
              <span className="font-medium text-foreground">{question.word}</span>: {question.definition}
            </span>
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
