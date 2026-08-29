"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import { submitQuizAnswerAction } from "@/lib/actions/vocabulary";
import type { QuizQuestionItem } from "@/lib/actions/vocabulary";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { getTopicName } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { PracticeTypeCode, Topic } from "@/types";

export function QuizSession({
  questions,
  topics,
  dict,
  warmupCode,
}: {
  questions: QuizQuestionItem[];
  topics: Topic[];
  dict: Dictionary;
  /** Set when rendered from /warmup for this practice type — swaps the exit links to /warmup
   * instead of /exercises or /dashboard, and reports completion the moment results are reached. */
  warmupCode?: PracticeTypeCode;
}) {
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctOptionId: string } | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = questions.length;

  useEffect(() => {
    if (finished && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.quizSession.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.quizSession.changeType}
        </Button>
      </div>
    );
  }

  const question = questions[index];
  const isAnswered = selectedId !== null;
  const isCorrect = result?.isCorrect ?? false;

  const handleSelect = async (optionId: string) => {
    if (isAnswered) return;
    setSelectedId(optionId);
    const outcome = await submitQuizAnswerAction(question.vocabId, optionId);
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
            {dict.quizSession.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.quizSession.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.quizSession.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/dashboard"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.errors.backToDashboard}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.quizSession.questionCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="secondary" className="max-w-xs truncate">
          {getTopicName(topics, question.topicId)}
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

      {result !== null && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isCorrect ? dict.quizSession.feedbackCorrect : dict.quizSession.feedbackWrong}
            <span className="font-medium text-foreground">{question.vocabWord}</span>:{" "}
            {question.definition}
            {question.explanation && <span className="block italic">{question.explanation}</span>}
          </p>
          <Button onClick={handleNext}>
            {index + 1 >= total ? dict.quizSession.viewResults : dict.quizSession.nextQuestion}
          </Button>
        </div>
      )}
    </div>
  );
}
