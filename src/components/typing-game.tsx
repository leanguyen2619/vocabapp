"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Vocabulary } from "@/types";

export function TypingGame({ vocabList }: { vocabList: Vocabulary[] }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = vocabList.length;
  const current = vocabList[index];
  const isCorrect = value.trim().toLowerCase() === current?.vocab.toLowerCase();

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
            Hoàn thành bài gõ từ!
          </h2>
          <p className="text-muted-foreground">
            Bạn gõ đúng {score}/{total} từ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            Làm lại
          </Button>
          <Button nativeButton={false} render={<Link href="/exercises" />}>
            Chọn dạng khác
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Progress value={(index / total) * 100}>
        <ProgressLabel>
          Từ {index + 1}/{total}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">Gõ từ tiếng Anh có nghĩa là</p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{current.meanVI}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{current.definition}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={checked}
          autoFocus
          autoComplete="off"
          placeholder="Nhập từ tiếng Anh..."
          className={cn(
            "max-w-xs text-center text-lg",
            checked && (isCorrect ? "border-emerald-500 bg-emerald-50" : "border-red-400 bg-red-50")
          )}
        />

        {checked && (
          <div className="flex items-center gap-2 text-sm">
            {isCorrect ? (
              <Badge variant="default" className="gap-1">
                <Check className="size-3.5" />
                Chính xác!
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <X className="size-3.5" />
                Đáp án: {current.vocab}
              </Badge>
            )}
          </div>
        )}

        <Button type="submit" disabled={!value.trim()}>
          {checked ? (index + 1 >= total ? "Xem kết quả" : "Từ tiếp theo") : "Kiểm tra"}
        </Button>
      </form>
    </div>
  );
}
