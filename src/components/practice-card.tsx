import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Wraps a practice page's game content in a Card instead of floating its bare elements directly
 * on the busy forest background — every /practice/* page and /quiz shared this exact gap before
 * (see the identical fix already applied to the daily warmup flow at src/app/warmup/page.tsx).
 * Centers vertically in the remaining viewport space so a short game (e.g. a single-question quiz)
 * doesn't leave a large empty expanse below it; degrades to normal top-anchored flow once the
 * game's own content is tall enough to fill the space on its own (a centered flex item can't push
 * past its container).
 */
export function PracticeCard({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-10 sm:py-16">
      <Card className="w-full">
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
