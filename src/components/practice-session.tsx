"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, Volume2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { recordVocabAttemptAction } from "@/lib/actions/progress";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { formatMessage } from "@/lib/i18n/format";
import { getTopicName } from "@/lib/labels";
import { speakWord } from "@/lib/speech";
import { cn } from "@/lib/utils";
import type { Topic, Vocabulary } from "@/types";

export function PracticeSession({
  vocabList,
  topics,
  exampleSentences,
  dict,
}: {
  vocabList: Vocabulary[];
  topics: Topic[];
  exampleSentences: Record<string, string>;
  dict: Dictionary;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = vocabList.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p>{dict.practiceSession.noQuestions}</p>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          {dict.errors.backToDashboard}
        </Button>
      </div>
    );
  }

  const current = vocabList[index];

  const handleMark = (known: boolean) => {
    if (known) {
      setKnownCount((c) => c + 1);
    } else {
      setReviewCount((c) => c + 1);
    }
    void recordVocabAttemptAction(current.id, known);

    if (index + 1 >= total) {
      setFinished(true);
      return;
    }

    setIndex((i) => i + 1);
    setFlipped(false);
  };

  const handleRestart = () => {
    setIndex(0);
    setFlipped(false);
    setKnownCount(0);
    setReviewCount(0);
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
            {dict.practiceSession.finishedTitle}
          </h2>
          <p className="text-muted-foreground">
            {formatMessage(dict.practiceSession.finishedSubtitle, { total })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 py-1 text-sm">
            <Check className="size-3.5 text-emerald-600" />
            {dict.practiceSession.knownLabel}: {knownCount}
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1 text-sm">
            <RotateCcw className="size-3.5 text-amber-600" />
            {dict.practiceSession.reviewLabel}: {reviewCount}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            {dict.practiceSession.restart}
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
          {formatMessage(dict.practiceSession.wordCounter, { current: index + 1, total })}
        </ProgressLabel>
      </Progress>

      <div className="relative perspective-distant">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          aria-label={dict.practiceSession.flipCardAriaLabel}
          className={cn(
            "relative h-72 w-full cursor-pointer rounded-3xl transition-transform duration-500 transform-3d sm:h-80",
            flipped && "transform-[rotateY(180deg)]"
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-8 shadow-sm backface-hidden">
            <Badge variant="secondary">{getTopicName(topics, current.topicId)}</Badge>
            <p className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {current.vocab}
            </p>
            {current.ipa && <p className="text-sm text-muted-foreground">{current.ipa}</p>}
            <span className="text-sm text-muted-foreground">{current.partOfSpeech}</span>
            <p className="mt-4 text-sm text-muted-foreground">{dict.practiceSession.tapToReveal}</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-border bg-card p-8 shadow-sm backface-hidden transform-[rotateY(180deg)]">
            <p className="text-2xl font-semibold text-foreground">{current.meanVI}</p>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              {current.definition}
            </p>
            {exampleSentences[current.id] && (
              <p className="max-w-sm text-center text-sm italic text-foreground/80">
                “{exampleSentences[current.id]}”
              </p>
            )}
          </div>
        </button>

        {!flipped && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={dict.vocabulary.playPronunciation}
            className="absolute right-6 top-6 z-10"
            onClick={() => speakWord(current.vocab)}
          >
            <Volume2 className="size-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 max-w-52 border-amber-300 text-amber-700 hover:bg-amber-50"
          onClick={() => handleMark(false)}
        >
          <X className="size-4" />
          {dict.practiceSession.reviewLabel}
        </Button>
        <Button
          size="lg"
          className="flex-1 max-w-52 bg-emerald-600 text-white hover:bg-emerald-600/90"
          onClick={() => handleMark(true)}
        >
          <Check className="size-4" />
          {dict.practiceSession.knownLabel}
        </Button>
      </div>
    </div>
  );
}
