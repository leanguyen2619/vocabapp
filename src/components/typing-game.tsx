"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, Volume2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { speakWord } from "@/lib/speech";
import { cn } from "@/lib/utils";
import type { PracticeTypeCode, Vocabulary } from "@/types";

export function TypingGame({
  vocabList,
  dict,
  warmupCode,
}: {
  vocabList: Vocabulary[];
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = vocabList.length;

  useEffect(() => {
    if (finished && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.typingGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.typingGame.changeType}
        </Button>
      </div>
    );
  }

  const current = vocabList[index];
  const isCorrect = value.trim().toLowerCase() === current.vocab.toLowerCase();

  const handleNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setValue("");
    setChecked(false);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;

    if (!checked) {
      setChecked(true);
      if (isCorrect) setScore((s) => s + 1);
      void recordVocabAttemptAction(current.id, isCorrect);
      return;
    }
    handleNext();
  };

  const handleRestart = () => {
    setIndex(0);
    setValue("");
    setChecked(false);
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
            {dict.typingGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.typingGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.typingGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.typingGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.typingGame.wordCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">{dict.typingGame.promptLabel}</p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{current.meanVI}</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={checked}
          autoFocus
          autoComplete="off"
          placeholder={dict.typingGame.inputPlaceholder}
          className={cn(
            "max-w-xs text-center text-lg",
            checked &&
              (isCorrect
                ? "border-emerald-500 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
                : "border-red-400 bg-red-50 dark:border-red-800/60 dark:bg-red-950/30")
          )}
        />

        {checked && (
          <div className="flex items-center gap-2 text-sm">
            {isCorrect ? (
              <Badge variant="default" className="gap-1">
                <Check className="size-3.5" />
                {dict.typingGame.correctBadge}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <X className="size-3.5" />
                {formatMessage(dict.typingGame.wrongBadge, { answer: current.vocab })}
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={dict.vocabulary.playPronunciation}
              onClick={() => speakWord(current.vocab)}
            >
              <Volume2 className="size-3.5" />
            </Button>
          </div>
        )}

        <Button type="submit" disabled={!value.trim()}>
          {checked
            ? index + 1 >= total
              ? dict.typingGame.viewResults
              : dict.typingGame.nextWord
            : dict.typingGame.checkButton}
        </Button>
      </form>
    </div>
  );
}
