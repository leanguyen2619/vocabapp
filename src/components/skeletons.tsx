import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Approximates every page's header bar (back link + brand) so it doesn't flash away and back
 * while a route's real content streams in — headers live inside each page, not a shared layout. */
function SkeletonHeader({ maxWidth }: { maxWidth: string }) {
  return (
    <header>
      <div className={cn("mx-auto flex w-full items-center justify-between px-6 py-4", maxWidth)}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-24" />
      </div>
    </header>
  );
}

/** Admin accounts/classes/levels/exercise-types/vocabulary/question-bank — a title bar plus a
 * card of stacked rows, matching the shared list layout every admin page uses. */
export function AdminListSkeleton({ maxWidth = "max-w-4xl", rows = 6 }: { maxWidth?: string; rows?: number }) {
  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <SkeletonHeader maxWidth={maxWidth} />
      <main className={cn("mx-auto flex w-full flex-1 flex-col gap-6 px-6 py-10", maxWidth)}>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i}>
                {i > 0 && <div className="my-3 h-px bg-border" />}
                <div className="flex items-center justify-between gap-3 py-1">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/** Student "My Vocabulary" — a grid of word cards. */
export function CardGridSkeleton({ maxWidth = "max-w-5xl", count = 9 }: { maxWidth?: string; count?: number }) {
  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <SkeletonHeader maxWidth={maxWidth} />
      <main className={cn("mx-auto flex w-full flex-1 flex-col gap-6 px-6 py-10", maxWidth)}>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-2 py-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-1 h-5 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

/** Quiz + every /practice/* game page — progress bar, then one centered question card. */
export function GameSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <SkeletonHeader maxWidth="max-w-2xl" />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10 sm:py-16">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex flex-col items-center gap-3 py-8">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      </main>
    </div>
  );
}

/** Dashboard — greeting, a row of stat/level cards, and a list card underneath. Rough enough to
 * fit both roles (student/admin), since each renders quite different real content. */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <SkeletonHeader maxWidth="max-w-5xl" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 py-4">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

/** Profile — avatar/name card, stat cards, then per-level progress cards. */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <SkeletonHeader maxWidth="max-w-3xl" />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-4 sm:flex-row sm:items-start">
            <Skeleton className="size-16 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 py-4">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

/** /exercises — the exercise-type picker grid. */
export function ExercisesSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <SkeletonHeader maxWidth="max-w-5xl" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
