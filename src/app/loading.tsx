import { BookOpen, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background py-24">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BookOpen className="size-5" />
      </div>
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}
