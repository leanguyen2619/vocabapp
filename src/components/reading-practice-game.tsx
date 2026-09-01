"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submitReadingTextAnswerAction } from "@/lib/actions/practice-content";
import type { ReadingTextData } from "@/lib/actions/practice-content";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { PracticeTypeCode } from "@/types";

interface QuestionResult {
  selectedId: string;
  isCorrect: boolean;
  correctOptionId: string;
}

export function ReadingPracticeGame({
  text,
  dict,
  warmupCode,
}: {
  text: ReadingTextData | null;
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  // Graded server-side the moment each question is answered (so progress still records in real
  // time), but withheld from the UI until every question has been answered — same reasoning as
  // ReadingComprehensionGame: read the whole thing and answer everything first, see results after.
  const [results, setResults] = useState<Record<string, QuestionResult>>({});
  // Per-question in-flight tracking — a Set, not a single id, so answering one question doesn't
  // lock out the others while its request is still resolving.
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  const [revealed, setRevealed] = useState(false);

  const questions = text?.questions ?? [];
  const total = questions.length;
  const allAnswered = total > 0 && questions.every((q) => results[q.id] !== undefined);
  const score = Object.values(results).filter((r) => r.isCorrect).length;

  useEffect(() => {
    if (revealed && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  if (!text || total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.readingPracticeGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.readingPracticeGame.changeType}
        </Button>
      </div>
    );
  }

  const handleSelect = async (questionId: string, optionId: string) => {
    if (results[questionId] || submittingIds.has(questionId)) return;
    setSubmittingIds((s) => new Set(s).add(questionId));
    const outcome = await submitReadingTextAnswerAction(questionId, optionId);
    setSubmittingIds((s) => {
      const next = new Set(s);
      next.delete(questionId);
      return next;
    });
    if ("error" in outcome) return;
    setResults((r) => ({ ...r, [questionId]: { selectedId: optionId, ...outcome } }));
  };

  const handleRestart = () => {
    setResults({});
    setRevealed(false);
  };

  if (revealed) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {dict.readingPracticeGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.readingPracticeGame.finishedSubtitle, { score, total })}
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-2 text-left">
          {questions.map((q, i) => {
            const r = results[q.id];
            return (
              <div
                key={q.id}
                className={cn(
                  "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
                  r?.isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                )}
              >
                {r?.isCorrect ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <X className="mt-0.5 size-4 shrink-0 text-red-500" />
                )}
                <p>
                  {formatMessage(dict.readingPracticeGame.questionLabel, { number: i + 1 })}: {q.questionText}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.readingPracticeGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.readingPracticeGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight">{text.title}</h2>
        <p className="text-base leading-relaxed whitespace-pre-line">{text.body}</p>
      </div>

      <div className="flex flex-col gap-6">
        {questions.map((q, i) => {
          const picked = results[q.id];
          const isAnswered = picked !== undefined;

          return (
            <div key={q.id} className="flex flex-col gap-3">
              <Badge variant="secondary" className="w-fit">
                {formatMessage(dict.readingPracticeGame.questionLabel, { number: i + 1 })}
              </Badge>
              <p className="text-base font-medium">{q.questionText}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((option) => {
                  const isSelected = option.id === picked?.selectedId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => void handleSelect(q.id, option.id)}
                      disabled={isAnswered || submittingIds.has(q.id)}
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
            </div>
          );
        })}
      </div>

      {allAnswered && (
        <div className="flex justify-center">
          <Button onClick={() => setRevealed(true)}>{dict.readingPracticeGame.viewResults}</Button>
        </div>
      )}
    </div>
  );
}
