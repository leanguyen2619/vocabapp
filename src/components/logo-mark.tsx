import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

/** The app's icon badge, used everywhere the brand wordmark appears (landing page, auth pages,
 * every dashboard/admin header). Previously a flat bg-primary square around a plain BookOpen —
 * this adds depth (gradient + glossy top highlight + soft shadow) and a small accent dot so the
 * mark reads as a proper app icon rather than a generic icon-in-a-box. */
export function LogoMark({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  const isSm = size === "sm";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm shadow-primary/40",
        isSm ? "size-7" : "size-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
      <BookOpen className={isSm ? "size-3.5" : "size-4"} strokeWidth={2.25} />
      <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-amber-300 shadow-[0_0_0_1.5px_var(--background)]" />
    </div>
  );
}
