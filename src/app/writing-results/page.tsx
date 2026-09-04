import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { WritingResultsClient } from "./writing-results-client";
import { BrandWordmark } from "@/components/brand-wordmark";
import { listMyWritingSubmissionsAction } from "@/lib/actions/writing-submissions";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.writingResults.title };
}

export default async function WritingResultsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());

  const [warmupStatus, submissions] = await Promise.all([
    getMyWarmupStatusAction(),
    listMyWritingSubmissionsAction(),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
      <header>
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-4">
          <Link
            href="/exercises"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {dict.common.backToExercises}
          </Link>
          <div className="flex items-center gap-2">
            <BrandWordmark size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10 sm:py-16">
        <WritingResultsClient submissions={submissions} dict={dict} />
      </main>
    </div>
  );
}
