"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Delete, PartyPopper, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import type { WordFormationPrompt } from "@/lib/mock-data";
import { cn, shuffle } from "@/lib/utils";

interface Tile {
  id: number;
  char: string;
}

interface PreparedPrompt extends WordFormationPrompt {
  tiles: Tile[];
}

function prepare(prompts: WordFormationPrompt[]): PreparedPrompt[] {
  return shuffle(prompts).map((p) => ({
    ...p,
    tiles: shuffle(p.word.split("").map((char, id) => ({ id, char }))),
  }));
}

export function WordFormationGame({ prompts }: { prompts: WordFormationPrompt[] }) {
  const [prepared] = useState<PreparedPrompt[]>(() => prepare(prompts));
  const [index, setIndex] = useState(0);
  const [placedIds, setPlacedIds] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [solved, setSolved] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = prepared.length;
  const prompt = prepared[index];
  const answer = placedIds.map((id) => prompt.tiles.find((t) => t.id === id)!.char).join("");

  const handlePlace = (tileId: number) => {
    if (solved || wrongFlash || placedIds.includes(tileId)) return;

    const nextIds = [...placedIds, tileId];
    setPlacedIds(nextIds);

    if (nextIds.length === prompt.tiles.length) {
      const attempt = nextIds.map((id) => prompt.tiles.find((t) => t.id === id)!.char).join("");
      if (attempt === prompt.word) {
        setSolved(true);
      } else {
        setWrongFlash(true);
        setWrongAttempts((c) => c + 1);
        setTimeout(() => {
          setWrongFlash(false);
          setPlacedIds([]);
        }, 600);
      }
    }
  };

  const handleBackspace = () => {
    if (solved || wrongFlash) return;
    setPlacedIds((ids) => ids.slice(0, -1));
  };

  const handleNext = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPlacedIds([]);
    setSolved(false);
  };

  const handleRestart = () => {
    setIndex(0);
    setPlacedIds([]);
    setSolved(false);
    setWrongAttempts(0);
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
            Hoàn thành trò chơi ghép từ!
          </h2>
          <p className="text-muted-foreground">
            Bạn đã ghép đúng {total} từ · {wrongAttempts} lần thử sai.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw className="size-4" />
            Chơi lại
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
        <Badge variant="secondary">{prompt.meanVI}</Badge>
        <p className="text-sm text-muted-foreground">{prompt.definition}</p>
      </div>

      <div
        className={cn(
          "flex min-h-14 flex-wrap items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border px-4 py-3",
          wrongFlash && "border-red-400 bg-red-50",
          solved && "border-emerald-500 bg-emerald-50"
        )}
      >
        {placedIds.length === 0 && (
          <span className="text-sm text-muted-foreground">Chạm vào các chữ bên dưới</span>
        )}
        {placedIds.map((id) => (
          <span
            key={id}
            className={cn(
              "flex size-9 items-center justify-center rounded-lg bg-card text-lg font-semibold uppercase ring-1 ring-foreground/10",
              solved && "bg-emerald-100 text-emerald-700"
            )}
          >
            {prompt.tiles.find((t) => t.id === id)!.char}
          </span>
        ))}
      </div>

      {!solved && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {prompt.tiles.map((tile) => (
            <button
              key={tile.id}
              type="button"
              disabled={placedIds.includes(tile.id) || wrongFlash}
              onClick={() => handlePlace(tile.id)}
              className="flex size-10 items-center justify-center rounded-lg border-2 border-border bg-card text-lg font-semibold uppercase transition-colors hover:border-primary/50 disabled:pointer-events-none disabled:opacity-30"
            >
              {tile.char}
            </button>
          ))}
          <Button variant="ghost" size="icon" aria-label="Xóa chữ cuối" onClick={handleBackspace}>
            <Delete className="size-4" />
          </Button>
        </div>
      )}

      {solved && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="size-4" />
            Chính xác! {answer} nghĩa là &ldquo;{prompt.meanVI}&rdquo;.
          </p>
          <Button onClick={handleNext}>{index + 1 >= total ? "Xem kết quả" : "Từ tiếp theo"}</Button>
        </div>
      )}
    </div>
  );
}
