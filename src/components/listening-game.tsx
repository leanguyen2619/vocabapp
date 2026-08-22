"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, Volume2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { Vocabulary } from "@/types";

function speak(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export function ListeningGame({ vocabList, dict }: { vocabList: Vocabulary[]; dict: Dictionary }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [supported, setSupported] = useState(true);

  const total = vocabList.length;
  const current = vocabList[index];
  const isCorrect = value.trim().toLowerCase() === current?.vocab.toLowerCase();

  useEffect(() => {
    // Browser-only feature check — the "supported" default of true is what the server
    // renders, avoiding a hydration mismatch (see docs/preventing-flash-before-hydration.md).
    const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(hasSpeechSynthesis);
  }, []);

  useEffect(() => {
    if (!finished && current) speak(current.vocab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished]);

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
            {dict.listeningGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.listeningGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.listeningGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href="/exercises" />}>
            {dict.listeningGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.listeningGame.wordCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{dict.listeningGame.promptLabel}</p>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          aria-label={dict.listeningGame.replayAriaLabel}
          onClick={() => speak(current.vocab)}
        >
          <Volume2 className="size-6" />
        </Button>
        {!supported && (
          <p className="text-xs text-destructive">{dict.listeningGame.unsupported}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={checked}
          autoFocus
          autoComplete="off"
          placeholder={dict.listeningGame.inputPlaceholder}
          className={cn(
            "max-w-xs text-center text-lg",
            checked && (isCorrect ? "border-emerald-500 bg-emerald-50" : "border-red-400 bg-red-50")
          )}
        />

        {checked && (
          <div className="flex flex-col items-center gap-1">
            {isCorrect ? (
              <Badge variant="default" className="gap-1">
                <Check className="size-3.5" />
                {dict.listeningGame.correctBadge}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <X className="size-3.5" />
                {formatMessage(dict.listeningGame.wrongBadge, { answer: current.vocab })}
              </Badge>
            )}
            <p className="text-sm text-muted-foreground">{current.meanVI}</p>
          </div>
        )}

        <Button type="submit" disabled={!value.trim()}>
          {checked
            ? index + 1 >= total
              ? dict.listeningGame.viewResults
              : dict.listeningGame.nextWord
            : dict.listeningGame.checkButton}
        </Button>
      </form>
    </div>
  );
}
