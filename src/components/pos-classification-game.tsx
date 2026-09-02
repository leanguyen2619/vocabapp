"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, Volume2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { submitPosAnswerAction } from "@/lib/actions/vocabulary";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { getTopicName } from "@/lib/labels";
import type { PosQuestion } from "@/lib/practice-prep";
import { speakWord } from "@/lib/speech";
import { cn } from "@/lib/utils";
import type { PartOfSpeech, PracticeTypeCode, Topic } from "@/types";

export function PosClassificationGame({
  questions,
  topics,
  dict,
  warmupCode,
}: {
  // Already shuffled server-side (via buildPosQuestions) by the page before this prop is passed
  // down — see FillBlankGame's comment on the same pattern for why shuffling client-side causes
  // a hydration mismatch.
  questions: PosQuestion[];
  topics: Topic[];
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<PartOfSpeech | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctPos: PartOfSpeech } | null>(null);
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
        <p>{dict.posGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.posGame.changeType}
        </Button>
      </div>
    );
  }

  const question = questions[index];
  const isAnswered = selected !== null;
  const isCorrect = result?.isCorrect ?? false;

  const handleSelect = async (option: PartOfSpeech) => {
    if (isAnswered) return;
    setSelected(option);
    const outcome = await submitPosAnswerAction(question.item.vocabId, option);
    if ("error" in outcome) {
      setSelected(null);
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
    setSelected(null);
    setResult(null);
  };

  const handleRestart = () => {
    setIndex(0);
    setSelected(null);
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
            {dict.posGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.posGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.posGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.posGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.posGame.wordCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <Badge variant="secondary" className="max-w-xs truncate">
          {getTopicName(topics, question.item.topicId)}
        </Badge>
        <div className="flex items-center gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {question.item.vocab}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={dict.vocabulary.playPronunciation}
            onClick={() => speakWord(question.item.vocab)}
          >
            <Volume2 className="size-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{question.item.definition}</p>
        <p className="text-base font-medium">{dict.posGame.questionPrompt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          const isThisCorrect = result !== null && option === result.correctPos;
          const isSelected = option === selected;

          return (
            <button
              key={option}
              type="button"
              onClick={() => void handleSelect(option)}
              disabled={isAnswered}
              className={cn(
                "flex items-center justify-between rounded-2xl border-2 border-border bg-card px-4 py-3 text-left text-base font-medium capitalize transition-colors disabled:cursor-default",
                !isAnswered && "hover:border-primary/50",
                isThisCorrect && "border-emerald-500 bg-emerald-50 text-emerald-700",
                result !== null &&
                  isSelected &&
                  !isThisCorrect &&
                  "border-red-400 bg-red-50 text-red-700"
              )}
            >
              {dict.partOfSpeech[option]}
              {isThisCorrect && <Check className="size-5 shrink-0 text-emerald-600" />}
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
            {isCorrect ? dict.posGame.feedbackCorrect : dict.posGame.feedbackWrong}{" "}
            {formatMessage(dict.posGame.resultPrefix, { word: question.item.vocab })}{" "}
            <span className="font-medium text-foreground">{dict.partOfSpeech[result.correctPos]}</span>.
          </p>
          <Button onClick={handleNext}>
            {index + 1 >= total ? dict.posGame.viewResults : dict.posGame.nextQuestion}
          </Button>
        </div>
      )}
    </div>
  );
}
