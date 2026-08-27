"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Eye, PartyPopper, RotateCcw, Volume2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  getListeningSentenceAudioAction,
  submitListeningComprehensionAnswerAction,
  type ListeningComprehensionItem,
} from "@/lib/actions/practice-content";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { speakWord } from "@/lib/speech";
import { cn, shuffle } from "@/lib/utils";
import type { PracticeTypeCode } from "@/types";

export function ListeningComprehensionGame({
  questions,
  dict,
  warmupCode,
}: {
  questions: ListeningComprehensionItem[];
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [prepared] = useState(() =>
    shuffle(questions).map((q) => ({ ...q, options: shuffle(q.options) }))
  );
  const [index, setIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctOptionId: string } | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [supported, setSupported] = useState(true);

  const total = prepared.length;
  const question = prepared[index] as ListeningComprehensionItem | undefined;

  useEffect(() => {
    // Browser-only feature check — the "supported" default of true is what the server renders,
    // avoiding a hydration mismatch (same pattern as ListeningGame).
    const hasSpeechSynthesis = typeof window !== "undefined" && "speechSynthesis" in window;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(hasSpeechSynthesis);
  }, []);

  useEffect(() => {
    if (finished || !question) return;
    let cancelled = false;
    void getListeningSentenceAudioAction(question.id).then((res) => {
      if (!cancelled && !("error" in res)) speakWord(res.text);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, finished]);

  useEffect(() => {
    if (finished && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (total === 0 || !question) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.listeningComprehensionGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.listeningComprehensionGame.changeType}
        </Button>
      </div>
    );
  }

  const handleReplay = () => {
    void getListeningSentenceAudioAction(question.id).then((res) => {
      if (!("error" in res)) speakWord(res.text);
    });
  };

  const isAnswered = selectedId !== null;
  const isCorrect = result?.isCorrect ?? false;
  const showText = revealed || result !== null;
  const [before, after] = question.sentenceTemplate.split("___");
  const selectedText = question.options.find((o) => o.id === selectedId)?.text;

  const handleSelect = async (optionId: string) => {
    if (isAnswered) return;
    setSelectedId(optionId);
    const outcome = await submitListeningComprehensionAnswerAction(question.id, optionId);
    if ("error" in outcome) {
      setSelectedId(null);
      return;
    }
    setResult(outcome);
    if (outcome.isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelectedId(null);
    setResult(null);
    setRevealed(false);
  };

  const handleRestart = () => {
    setIndex(0);
    setSelectedId(null);
    setResult(null);
    setScore(0);
    setFinished(false);
    setRevealed(false);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {dict.listeningComprehensionGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.listeningComprehensionGame.finishedSubtitle, { score, total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.listeningComprehensionGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/exercises"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.listeningComprehensionGame.changeType}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          {formatMessage(dict.listeningComprehensionGame.questionCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{dict.listeningComprehensionGame.promptLabel}</p>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          aria-label={dict.listeningComprehensionGame.replayAriaLabel}
          onClick={handleReplay}
        >
          <Volume2 className="size-6" />
        </Button>
        {!supported && (
          <p className="text-xs text-destructive">{dict.listeningComprehensionGame.unsupported}</p>
        )}

        {showText ? (
          <p className="text-lg leading-relaxed">
            {before}
            <span
              className={cn(
                "mx-1 inline-block min-w-16 rounded-md border-b-2 border-dashed border-primary/60 px-1 text-center font-semibold",
                result !== null && isCorrect && "border-emerald-500 text-emerald-700",
                result !== null && !isCorrect && "border-red-400 text-red-700"
              )}
            >
              {selectedText ?? "___"}
            </span>
            {after}
          </p>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setRevealed(true)}>
            <Eye className="size-4" />
            {dict.listeningComprehensionGame.revealText}
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          {formatMessage(dict.listeningComprehensionGame.hint, { mean: question.meanVI })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
        <div className="flex justify-center">
          <Button onClick={handleNext}>
            {index + 1 >= total
              ? dict.listeningComprehensionGame.viewResults
              : dict.listeningComprehensionGame.nextQuestion}
          </Button>
        </div>
      )}
    </div>
  );
}
