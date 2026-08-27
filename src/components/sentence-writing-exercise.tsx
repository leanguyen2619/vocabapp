"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Lightbulb, PartyPopper, RotateCcw, Send, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { submitSentenceAction } from "@/lib/actions/writing-submissions";
import type { SentencePromptItem } from "@/lib/actions/practice-content";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { speakWord } from "@/lib/speech";
import type { PracticeTypeCode } from "@/types";

export function SentenceWritingExercise({
  prompts,
  dict,
  warmupCode,
}: {
  prompts: SentencePromptItem[];
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        <p>{dict.writingExercise.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.writingExercise.changeType}
        </Button>
      </div>
    );
  }

  const prompt = prompts[index];

  const goNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setText("");
    setShowExample(false);
  };

  const handleSubmit = () => {
    if (!text.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await submitSentenceAction(prompt.vocabId, text);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSubmittedCount((c) => c + 1);
      goNext();
    });
  };

  const handleRestart = () => {
    setIndex(0);
    setText("");
    setShowExample(false);
    setSubmittedCount(0);
    setFinished(false);
    setError(null);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {dict.writingExercise.finishedTitle}
          </h2>
          <p className="max-w-sm text-muted-foreground">
            {formatMessage(dict.writingExercise.finishedSubtitle, { total: submittedCount })}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.writingExercise.restart}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/writing-results" />}>
            {dict.writingExercise.viewResultsButton}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.writingExercise.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.writingExercise.questionCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-muted-foreground">{dict.writingExercise.promptLabel}</p>
        <div className="flex items-center gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">{prompt.vocab}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={dict.vocabulary.playPronunciation}
            onClick={() => speakWord(prompt.vocab)}
          >
            <Volume2 className="size-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{prompt.meanVI}</p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={formatMessage(dict.writingExercise.textareaPlaceholder, { word: prompt.vocab })}
        rows={4}
        disabled={isPending}
      />

      {showExample ? (
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p>
            {dict.writingExercise.exampleLabel}{" "}
            <span className="italic">{prompt.exampleSentence}</span>
          </p>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setShowExample(true)}
          disabled={isPending}
        >
          <Lightbulb className="size-4" />
          {dict.writingExercise.showExample}
        </Button>
      )}

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-center">
        <Button disabled={!text.trim() || isPending} onClick={handleSubmit}>
          <Send className="size-4" />
          {isPending ? dict.writingExercise.submitting : dict.writingExercise.submitButton}
        </Button>
      </div>
    </div>
  );
}
