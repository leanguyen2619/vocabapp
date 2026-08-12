"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
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
        <h1 className="font-heading text-xl font-semibold tracking-tight">Đã có lỗi xảy ra</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Rất tiếc, trang này gặp sự cố. Bạn có thể thử lại hoặc quay về Dashboard.
        </p>
        {error.digest && <p className="text-xs text-muted-foreground">Mã lỗi: {error.digest}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => unstable_retry()}>
          <RotateCcw className="size-4" />
          Thử lại
        </Button>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Về Dashboard
        </Button>
      </div>
    </div>
  );
}
