import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import type { Dictionary } from "@/lib/i18n/dictionaries";

export function AdminOnlyDenied({ dict }: { dict: Dictionary }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <ShieldAlert className="size-8 text-muted-foreground" />
      <p className="text-muted-foreground">{dict.errors.adminOnly}</p>
      <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
        {dict.errors.backToDashboard}
      </Link>
    </div>
  );
}
