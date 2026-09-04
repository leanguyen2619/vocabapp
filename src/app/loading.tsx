import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background py-24">
      {/* The source image has a solid white background baked in (no transparency) — wrapping it in
       * its own white card keeps it looking intentional (a logo badge) instead of an unstyled
       * white rectangle when the page itself is in dark mode. */}
      <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
        <Image src="/vocabbuilder-logo.jpg" alt="VocabBuilder" width={1999} height={400} className="h-10 w-auto sm:h-12" priority />
      </div>
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
