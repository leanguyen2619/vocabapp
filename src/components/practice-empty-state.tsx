import Link from "next/link";
import { PackageOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown inside a practice game's Card when there's no content to run (no words assigned, no
 * approved questions for the type, etc.). Was a bare centred `<p>` + button with `py-16` in every
 * game component, which — now that each game sits inside PracticeCard — rendered as a mostly-empty
 * oversized card. This keeps it compact and gives it a small icon so it reads as a deliberate
 * state rather than a half-loaded page. */
export function PracticeEmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <PackageOpen className="size-6 text-muted-foreground" />
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
      <Button nativeButton={false} render={<Link href={actionHref} />}>
        {actionLabel}
      </Button>
    </div>
  );
}
