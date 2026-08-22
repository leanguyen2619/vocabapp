"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import type { SynonymAntonymQuestion } from "@/lib/mock-data";
import { cn, shuffle } from "@/lib/utils";

interface PreparedQuestion extends SynonymAntonymQuestion {
  shuffledOptions: string[];
}

function prepare(questions: SynonymAntonymQuestion[]): PreparedQuestion[] {
  return shuffle(questions).map((q) => ({ ...q, shuffledOptions: shuffle(q.options) }));
}

export function SynonymAntonymGame({
  questions,
  dict,
}: {
  questions: SynonymAntonymQuestion[];
  dict: Dictionary;
}) {
  const relationLabel = {
    synonym: dict.synonymAntonymGame.relationSynonym,
    antonym: dict.synonymAntonymGame.relationAntonym,
  };
  const [prepared] = useState<PreparedQuestion[]>(() => prepare(questions));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = prepared.length;
  const question = prepared[index];
  const isAnswered = selected !== null;
  const isCorrect = selected === question.correctAnswer;

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelected(option);
    if (option === question.correctAnswer) {
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
        <Badge variant="secondary">{relationLabel[question.relation]}</Badge>
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {formatMessage(dict.synonymAntonymGame.questionPrompt, {
            relation: relationLabel[question.relation],
            word: question.word,
          })}
        </h2>
        <p className="text-sm text-muted-foreground">{question.meanVI}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isCorrect
              ? dict.synonymAntonymGame.feedbackCorrect
              : formatMessage(dict.synonymAntonymGame.feedbackWrong, {
                  answer: question.correctAnswer,
                })}
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
