"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import { FillBlankGame } from "@/components/fill-blank-game";
import { useRequireSession } from "@/hooks/use-session";
import { fillBlankQuestions } from "@/lib/mock-data";

export default function FillBlankPage() {
  const { status } = useRequireSession();

  if (status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/exercises"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dạng bài tập
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <FillBlankGame questions={fillBlankQuestions} />
      </main>
    </div>
  );
}
