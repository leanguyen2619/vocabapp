"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import type { WordTransformationItem } from "@/lib/actions/practice-content";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { PracticeTypeCode } from "@/types";

/** Splits a sentence on its literal "___" blank marker into [before, after] — same convention as
 * FillBlankItem.sentence/ListeningComprehensionItem.sentenceTemplate. */
function splitSentence(sentence: string): [string, string] {
  const i = sentence.indexOf("___");
  if (i === -1) return [sentence, ""];
  return [sentence.slice(0, i), sentence.slice(i + 3)];
}

export function WordTransformationGame({
  prompts,
  dict,
  warmupCode,
}: {
  prompts: WordTransformationItem[];
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = prompts.length;

  useEffect(() => {
    if (finished && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.wordTransformationGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.wordTransformationGame.changeType}
        </Button>
      </div>
    );
  }

  const current = prompts[index];
  const [before, after] = splitSentence(current.sentence);
  const isCorrect = value.trim().toLowerCase() === current.answer.toLowerCase();

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
      void recordVocabAttemptAction(current.vocabId, isCorrect);
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
            {dict.wordTransformationGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.wordTransformationGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.wordTransformationGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.wordTransformationGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.wordTransformationGame.questionCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center">
        <p className="text-base leading-relaxed">
          {before}
          <span className="mx-1 inline-block min-w-16 rounded-md border-b-2 border-dashed border-primary px-1 font-semibold text-primary">
            {checked ? current.answer : "…"}
          </span>
          {after}
        </p>
        <Badge variant="secondary">
          {formatMessage(dict.wordTransformationGame.rootWordLabel, { word: current.rootWord })}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={checked}
          autoFocus
          autoComplete="off"
          placeholder={dict.wordTransformationGame.inputPlaceholder}
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
                {dict.wordTransformationGame.correctBadge}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <X className="size-3.5" />
                {formatMessage(dict.wordTransformationGame.wrongBadge, { answer: current.answer })}
              </Badge>
            )}
          </div>
        )}

        <Button type="submit" disabled={!value.trim()}>
          {checked
            ? index + 1 >= total
              ? dict.wordTransformationGame.viewResults
              : dict.wordTransformationGame.nextQuestion
            : dict.wordTransformationGame.checkButton}
        </Button>
      </form>
    </div>
  );
}
