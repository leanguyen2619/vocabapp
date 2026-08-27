import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Clock,
  Headphones,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getMyStudentLevelIndexAction, listLevelsAction } from "@/lib/actions/levels";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getCurrentAccount } from "@/lib/session";
import type { PracticeTypeCode } from "@/types";
import { parseWordScope, WORD_SCOPED_CODES, WORD_SCOPES, type WordScope } from "@/lib/word-scope";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

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
  listening_comprehension: Headphones,
};

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const isStudent = account.role === "student";
  const scope: WordScope = isStudent ? parseWordScope((await searchParams).scope) : "mixed";

  // getMyStudentLevelIndexAction doesn't depend on levels/types (it derives its own level list
  // internally), so it belongs in the same round trip instead of a second sequential one.
  const [warmupStatus, levels, types, fetchedStudentLevelIndex] = await Promise.all([
    getMyWarmupStatusAction(),
    listLevelsAction(),
    listExerciseTypesAction(),
    isStudent ? getMyStudentLevelIndexAction() : Promise.resolve(null),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);
  const studentLevelIndex = fetchedStudentLevelIndex ?? levels.length;
  const studentLevelName = levels[studentLevelIndex - 1]?.level;

  const visibleTypes = types
    .filter((t) => t.enabled && t.level <= studentLevelIndex)
    .sort((a, b) => a.level - b.level);

  const scopeLabel: Record<WordScope, string> = {
    new: dict.exercises.scopeNew,
    mixed: dict.exercises.scopeMixed,
    old: dict.exercises.scopeOld,
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {dict.common.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{dict.exercises.title}</h1>
          <p className="text-muted-foreground">
            {dict.exercises.subtitle}
            {isStudent && studentLevelName && (
              <>
                {" "}
                {dict.exercises.currentLevel.split("{level}")[0]}
                <span className="font-medium text-foreground">{studentLevelName}</span>
                {dict.exercises.currentLevel.split("{level}")[1]}
              </>
            )}
          </p>
        </div>

        {isStudent && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">{dict.exercises.scopeLabel}</p>
            <div className="flex flex-wrap gap-2">
              {WORD_SCOPES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === scope ? "default" : "outline"}
                  nativeButton={false}
                  render={<Link href={`/exercises?scope=${s}`} />}
                >
                  {scopeLabel[s]}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTypes.map((type) => {
            const Icon = iconByCode[type.code];
            const isReady = Boolean(type.href);
            const href =
              isReady && isStudent && WORD_SCOPED_CODES.includes(type.code)
                ? `${type.href}?scope=${scope}`
                : type.href;

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
                    {dict.exercises.comingSoon}
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
              <Link key={type.code} href={href!}>
                <Card className="h-full transition-colors hover:border-primary/50">{cardBody}</Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
