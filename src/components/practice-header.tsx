import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RandomExerciseButton } from "@/components/random-exercise-button";
import { BrandWordmark } from "@/components/brand-wordmark";
import type { ExerciseTypeSummary } from "@/lib/actions/exercise-types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PracticeTypeCode } from "@/types";

/** Shared header for every /practice/<type> page — back link + shuffle-to-another-type button on
 * the left, brand lockup on the right. Was copy-pasted identically into all 12 practice pages
 * (only `currentCode` differed); consolidated here after the copies drifted into a real mobile bug
 * — at 390px the three items didn't fit on one line and "Dạng bài tập" wrapped mid-word. Fixed by
 * hiding the wordmark text below `sm` (the icon badge alone still identifies the brand) and
 * pinning the back-link to one line, rather than letting it wrap. */
export function PracticeHeader({
  currentCode,
  types,
  dict,
}: {
  currentCode: PracticeTypeCode;
  types: ExerciseTypeSummary[];
  dict: Dictionary;
}) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/exercises"
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {dict.common.backToExercises}
          </Link>
          <RandomExerciseButton currentCode={currentCode} types={types} dict={dict} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <BrandWordmark size="sm" />
        </div>
      </div>
    </header>
  );
}
