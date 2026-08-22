"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { getTopicName } from "@/lib/labels";
import { cn, shuffle } from "@/lib/utils";
import type { Topic, Vocabulary } from "@/types";

interface QuizQuestion {
  vocab: Vocabulary;
  options: Vocabulary[];
}

function buildQuestions(vocabList: Vocabulary[]): QuizQuestion[] {
  return shuffle(vocabList).map((vocab) => ({
    vocab,
    options: shuffle(vocabList),
  }));
}

export function QuizSession({
  vocabList,
  topics,
  dict,
}: {
  vocabList: Vocabulary[];
  topics: Topic[];
  dict: Dictionary;
}) {
  const [questions] = useState<QuizQuestion[]>(() => buildQuestions(vocabList));
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const question = questions[index];
  const isAnswered = selectedId !== null;
  const isCorrect = selectedId === question.vocab.id;

  const handleSelect = (optionId: string) => {
    if (isAnswered) return;
    setSelectedId(optionId);
    const correct = optionId === question.vocab.id;
    if (correct) {
      setScore((s) => s + 1);
    }
    void recordVocabAttemptAction(question.vocab.id, correct);
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
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            {dict.errors.backToDashboard}
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
        <Badge variant="secondary">{getTopicName(topics, question.vocab.topicId)}</Badge>
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {formatMessage(dict.quizSession.questionPrompt, { mean: question.vocab.meanVI })}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => {
          const isThisCorrect = option.id === question.vocab.id;
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
              {option.vocab}
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
            {isCorrect ? dict.quizSession.feedbackCorrect : dict.quizSession.feedbackWrong}
            <span className="font-medium text-foreground">{question.vocab.vocab}</span>:{" "}
            {question.vocab.definition}
          </p>
          <Button onClick={handleNext}>
            {index + 1 >= total ? dict.quizSession.viewResults : dict.quizSession.nextQuestion}
          </Button>
        </div>
      )}
    </div>
  );
}
