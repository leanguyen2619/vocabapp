import Image from "next/image";

import { cn } from "@/lib/utils";

/** The header brand lockup — the reindeer + "VocabBuilder" letter-block wordmark image, replacing
 * the old LogoMark-icon-plus-text pair everywhere it appeared. The source image has a solid white
 * background baked in (no transparency), so it's wrapped in its own small white card exactly like
 * the loading screen's use of the same artwork — otherwise it would show as an unstyled white
 * rectangle in dark-mode headers. */
export function BrandWordmark({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  const isSm = size === "sm";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center rounded-lg bg-white shadow-sm",
        isSm ? "h-7 px-1.5" : "h-8 px-2",
        className
      )}
    >
      <Image
        src="/vocabbuilder-logo.jpg"
        alt="VocabBuilder"
        width={1999}
        height={400}
        priority
        className={isSm ? "h-4 w-auto" : "h-5 w-auto"}
      />
    </div>
  );
}
