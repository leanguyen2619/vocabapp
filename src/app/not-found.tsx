import Link from "next/link";
import { BookOpen, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";

export default async function NotFound() {
  const dict = getDictionary(await getLocale());

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 py-24 text-center">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BookOpen className="size-4" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Compass className="size-6 text-muted-foreground" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {dict.errors.notFoundTitle}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">{dict.errors.notFoundSubtitle}</p>
      </div>

      <Button nativeButton={false} render={<Link href="/" />}>
        {dict.errors.backHome}
      </Button>
    </div>
  );
}
