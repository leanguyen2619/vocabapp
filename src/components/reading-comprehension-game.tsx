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

interface BlankResult {
  selectedId: string;
  isCorrect: boolean;
  correctOptionId: string;
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
  // Keyed by blank id — graded server-side the moment each blank is picked (so progress still
  // records in real time), but deliberately not SHOWN until every blank has been answered, per
  // the real exam flow this mirrors: work through the whole passage first, see results after.
  const [results, setResults] = useState<Record<string, BlankResult>>({});
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  const blanks = passage?.blanks ?? [];
  const total = blanks.length;
  const score = Object.values(results).filter((r) => r.isCorrect).length;

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

  const segments = splitBody(passage.body);

  const handleRestart = () => {
    setIndex(0);
    setResults({});
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

        <div className="flex w-full max-w-md flex-col gap-2 text-left">
          {blanks.map((b) => {
            const r = results[b.id];
            return (
              <div
                key={b.id}
                className={cn(
                  "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                  r?.isCorrect
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20"
                    : "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20"
                )}
              >
                {r?.isCorrect ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="mt-0.5 size-4 shrink-0 text-red-500 dark:text-red-400" />
                )}
                <p>
                  {formatMessage(dict.readingComprehensionGame.blankLabel, { number: b.blankNumber })}:{" "}
                  <span className="font-medium text-foreground">{b.word}</span> — {b.definition}
                </p>
              </div>
            );
          })}
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

  const blank = blanks[index];
  const picked = results[blank.id];
  const isAnswered = picked !== undefined;

  const handleSelect = async (optionId: string) => {
    if (isAnswered || submitting) return;
    setSubmitting(true);
    const outcome = await submitReadingAnswerAction(blank.id, optionId);
    setSubmitting(false);
    if ("error" in outcome) return;
    setResults((r) => ({ ...r, [blank.id]: { selectedId: optionId, ...outcome } }));
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
  };

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
          const isSelected = option.id === picked?.selectedId;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => void handleSelect(option.id)}
              disabled={isAnswered || submitting}
              className={cn(
                "flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium transition-colors disabled:cursor-default",
                !isAnswered && "hover:border-primary/50",
                isSelected && "border-primary bg-primary/5"
              )}
            >
              {option.text}
              {isSelected && <Check className="size-5 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="flex justify-center">
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
