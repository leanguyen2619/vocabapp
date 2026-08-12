import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Clock,
  Layers,
  ListChecks,
  PenLine,
  Puzzle,
  Shuffle,
  Tags,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyStudentLevelIndexAction, listLevelsAction } from "@/lib/actions/levels";
import { getCurrentAccount } from "@/lib/session";
import type { PracticeTypeCode } from "@/types";

const iconByCode: Record<PracticeTypeCode, LucideIcon> = {
  multiple_choice: ListChecks,
  flashcard: Layers,
  matching: Shuffle,
  pos_classification: Tags,
  sentence_writing: PenLine,
  synonym_antonym: ArrowLeftRight,
  fill_blank: TextCursorInput,
  word_formation: Puzzle,
  typing: TextCursorInput,
  listening: TextCursorInput,
};

export default async function ExercisesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const isStudent = account.role === "student";
  const [levels, types] = await Promise.all([listLevelsAction(), listExerciseTypesAction()]);
  const studentLevelIndex = isStudent ? await getMyStudentLevelIndexAction() : levels.length;
  const studentLevelName = levels[studentLevelIndex - 1]?.level;

  const visibleTypes = types
    .filter((t) => t.enabled && t.level <= studentLevelIndex)
    .sort((a, b) => a.level - b.level);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Chọn dạng bài tập</h1>
          <p className="text-muted-foreground">
            Chọn một dạng bài tập bên dưới để bắt đầu luyện tập.
            {isStudent && studentLevelName && (
              <> Cấp độ hiện tại của bạn: <span className="font-medium text-foreground">{studentLevelName}</span>.</>
            )}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTypes.map((type) => {
            const Icon = iconByCode[type.code];
            const isReady = Boolean(type.href);

            const cardBody = (
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <Badge variant="secondary">Lv{type.level}</Badge>
                </div>
                <div>
                  <p className="font-medium">{type.name}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                {!isReady && (
                  <Badge variant="outline" className="w-fit gap-1 text-muted-foreground">
                    <Clock className="size-3" />
                    Sắp ra mắt
                  </Badge>
                )}
              </CardContent>
            );

            if (!isReady) {
              return (
                <Card key={type.code} className="opacity-60">
                  {cardBody}
                </Card>
              );
            }

            return (
              <Link key={type.code} href={type.href!}>
                <Card className="h-full transition-colors hover:border-primary/50">{cardBody}</Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
