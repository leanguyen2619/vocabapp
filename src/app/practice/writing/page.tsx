import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { SentenceWritingExercise } from "@/components/sentence-writing-exercise";
import { RandomExerciseButton } from "@/components/random-exercise-button";
import { listExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getCurrentAccount } from "@/lib/session";
import { sentencePrompts } from "@/lib/mock-data";

export default async function SentenceWritingPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const exerciseTypes = await listExerciseTypesAction();

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/exercises"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Dạng bài tập
            </Link>
            <RandomExerciseButton currentCode="sentence_writing" types={exerciseTypes} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10 sm:py-16">
        <SentenceWritingExercise prompts={sentencePrompts} />
      </main>
    </div>
  );
}
