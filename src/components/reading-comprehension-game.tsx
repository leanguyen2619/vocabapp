"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { submitReadingAnswerAction } from "@/lib/actions/practice-content";
import type { ReadingPassageData } from "@/lib/actions/practice-content";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { PracticeTypeCode } from "@/types";

/** Splits the passage body on its literal "___N___" markers into alternating
 * [text, blankNumber, text, blankNumber, ..., text] — see ReadingPassageData.body. */
function splitBody(body: string): { text: string; blankNumber: number | null }[] {
  const parts = body.split(/___(\d+)___/g);
  return parts.map((part, i) => (i % 2 === 1 ? { text: "", blankNumber: Number(part) } : { text: part, blankNumber: null }));
}

export function ReadingComprehensionGame({
  passage,
  dict,
  warmupCode,
}: {
  passage: ReadingPassageData | null;
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctOptionId: string } | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const blanks = passage?.blanks ?? [];
  const total = blanks.length;

  useEffect(() => {
    if (finished && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (!passage || total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.readingComprehensionGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.readingComprehensionGame.changeType}
        </Button>
      </div>
    );
  }

  const blank = blanks[index];
  const isAnswered = selectedId !== null;
  const isCorrect = result?.isCorrect ?? false;
  const segments = splitBody(passage.body);

  const handleSelect = async (optionId: string) => {
    if (isAnswered) return;
    setSelectedId(optionId);
    const outcome = await submitReadingAnswerAction(blank.id, optionId);
    if ("error" in outcome) {
      setSelectedId(null);
      return;
    }
    setResult(outcome);
    if (outcome.isCorrect) setScore((s) => s + 1);
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
            {dict.readingComprehensionGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.readingComprehensionGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.readingComprehensionGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.readingComprehensionGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.readingComprehensionGame.questionCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{passage.title}</h2>
        <p className="text-base leading-relaxed whitespace-pre-line">
          {segments.map((seg, i) =>
            seg.blankNumber === null ? (
              <span key={i}>{seg.text}</span>
            ) : (
              <span
                key={i}
                className={cn(
                  "mx-0.5 inline-block rounded-md border-b-2 border-dashed px-1 font-semibold",
                  seg.blankNumber === blank.blankNumber
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                ({seg.blankNumber})
              </span>
            )
          )}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="secondary">
          {formatMessage(dict.readingComprehensionGame.blankLabel, { number: blank.blankNumber })}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {blank.options.map((option) => {
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

      {result !== null && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isCorrect
              ? dict.readingComprehensionGame.feedbackCorrect
              : dict.readingComprehensionGame.feedbackWrong}
            <span className="block">
              <span className="font-medium text-foreground">{blank.word}</span>: {blank.definition}
            </span>
          </p>
          <Button onClick={handleNext}>
            {index + 1 >= total
              ? dict.readingComprehensionGame.viewResults
              : dict.readingComprehensionGame.nextQuestion}
          </Button>
        </div>
      )}
    </div>
  );
}
