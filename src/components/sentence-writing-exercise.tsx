"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Lightbulb, PartyPopper, RotateCcw, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { SentencePrompt } from "@/lib/mock-data";

export function SentenceWritingExercise({ prompts }: { prompts: SentencePrompt[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [confidentCount, setConfidentCount] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = prompts.length;
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

  const handleSelfMark = (confident: boolean) => {
    if (confident) setConfidentCount((c) => c + 1);
    else setPracticeCount((c) => c + 1);
    goNext();
  };

  const handleRestart = () => {
    setIndex(0);
    setText("");
    setShowExample(false);
    setConfidentCount(0);
    setPracticeCount(0);
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
            Hoàn thành bài viết câu!
          </h2>
          <p className="text-muted-foreground">Bạn đã luyện viết {total} câu.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 py-1 text-sm">
            <Check className="size-3.5 text-emerald-600" />
            Tự tin: {confidentCount}
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1 text-sm">
            <RotateCcw className="size-3.5 text-amber-600" />
            Cần luyện thêm: {practiceCount}
          </Badge>
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
          Câu {index + 1}/{total}
        </ProgressLabel>
      </Progress>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm text-muted-foreground">Đặt câu với từ</p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{prompt.vocab}</h2>
        <p className="text-sm text-muted-foreground">{prompt.meanVI}</p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Viết một câu tiếng Anh có dùng từ "${prompt.vocab}"...`}
        rows={4}
      />

      {showExample ? (
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p>
            Câu mẫu: <span className="italic">{prompt.exampleSentence}</span>
          </p>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setShowExample(true)}>
          <Lightbulb className="size-4" />
          Xem câu mẫu
        </Button>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
          onClick={() => handleSelfMark(false)}
        >
          <X className="size-4" />
          Cần luyện thêm
        </Button>
        <Button
          className="bg-emerald-600 text-white hover:bg-emerald-600/90"
          onClick={() => handleSelfMark(true)}
        >
          <Check className="size-4" />
          Tôi đã viết đúng
        </Button>
      </div>
    </div>
  );
}
