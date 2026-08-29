"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { BookOpen, RotateCcw, TriangleAlert } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { formatMessage } from "@/lib/i18n/format";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const { dict } = useLocale();

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background px-6 py-24 text-center">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BookOpen className="size-4" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert className="size-6 text-destructive" />
        </div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">{dict.errors.title}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{dict.errors.subtitle}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            {formatMessage(dict.errors.errorCode, { digest: error.digest })}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => unstable_retry()}>
          <RotateCcw className="size-4" />
          {dict.errors.retry}
        </Button>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          {dict.errors.backToDashboard}
        </Button>
      </div>
    </div>
  );
}
