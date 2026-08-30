"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PartyPopper, RotateCcw, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import { markWarmupTypeCompleteAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import type { PracticeTypeCode, Vocabulary } from "@/types";

interface Selection {
  side: "left" | "right";
  id: string;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MatchingGame({
  leftItems,
  rightItems,
  dict,
  warmupCode,
}: {
  // Already shuffled server-side (independently for each column) by the page before these props
  // are passed down — see FillBlankGame's comment on the same pattern for why shuffling
  // client-side causes a hydration mismatch.
  leftItems: Vocabulary[];
  rightItems: Vocabulary[];
  dict: Dictionary;
  warmupCode?: PracticeTypeCode;
}) {
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Selection | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const total = leftItems.length;
  const finished = matchedIds.size === total;

  useEffect(() => {
    if (finished) return;
    const interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [finished]);

  useEffect(() => {
    if (finished && warmupCode) {
      void markWarmupTypeCompleteAction(warmupCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.matchingGame.noQuestions}</p>
        <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/dashboard"} />}>
          {warmupCode ? dict.warmup.continueButton : dict.errors.backToDashboard}
        </Button>
      </div>
    );
  }

  const handleSelect = (side: "left" | "right", id: string) => {
    if (matchedIds.has(id) || wrongIds.length > 0) return;

    if (!selected) {
      setSelected({ side, id });
      return;
    }
    if (selected.side === side) {
      setSelected({ side, id });
      return;
    }

    setAttempts((a) => a + 1);
    if (selected.id === id) {
      setMatchedIds((prev) => new Set(prev).add(id));
      setSelected(null);
      void recordVocabAttemptAction(id, true);
    } else {
      const wrongPair = [selected.id, id];
      setWrongIds(wrongPair);
      void recordVocabAttemptAction(selected.id, false);
      void recordVocabAttemptAction(id, false);
      setTimeout(() => {
        setWrongIds([]);
        setSelected(null);
      }, 500);
    }
  };

  const handleRestart = () => {
    setMatchedIds(new Set());
    setSelected(null);
    setWrongIds([]);
    setAttempts(0);
    setElapsedSec(0);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-8 text-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {dict.matchingGame.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.matchingGame.finishedSubtitle, {
              time: formatTime(elapsedSec),
              attempts,
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.matchingGame.restart}
          </Button>
          <Button nativeButton={false} render={<Link href={warmupCode ? "/warmup" : "/dashboard"} />}>
            {warmupCode ? dict.warmup.continueButton : dict.errors.backToDashboard}
          </Button>
        </div>
      </div>
    );
  }

  const renderItem = (item: Vocabulary, side: "left" | "right") => {
    const label = side === "left" ? item.vocab : item.meanVI;
    const isMatched = matchedIds.has(item.id);
    const isSelected = selected?.side === side && selected.id === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleSelect(side, item.id)}
        disabled={isMatched}
        className={cn(
          "w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default",
          !isMatched && !isSelected && "hover:border-primary/50",
          isSelected && "border-primary bg-primary/5",
          isMatched && "border-emerald-500 bg-emerald-50 text-emerald-700",
          wrongIds.includes(item.id) && "border-red-400 bg-red-50 text-red-700"
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="gap-1">
          <Timer className="size-3.5" />
          {formatTime(elapsedSec)}
        </Badge>
        <p className="text-sm text-muted-foreground">
          {formatMessage(dict.matchingGame.progressText, {
            matched: matchedIds.size,
            total,
            attempts,
          })}
        </p>
      </div>

      <div className="flex flex-col gap-2 text-center">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {dict.matchingGame.title}
        </h2>
        <p className="text-sm text-muted-foreground">{dict.matchingGame.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">{leftItems.map((item) => renderItem(item, "left"))}</div>
        <div className="flex flex-col gap-2">{rightItems.map((item) => renderItem(item, "right"))}</div>
      </div>
    </div>
  );
}
