import { AlertCircle, Building2, CheckCircle2, Library, Users } from "lucide-react";

import { NatureHeroIllustration } from "@/components/nature-hero-illustration";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

/** Admin-side counterpart to DashboardOverviewCard (the student dashboard's hero) — same nature
 * illustration and green palette scoped to just this card, but the status message and stat rows
 * reflect admin-relevant signals (pending grading) instead of a student's daily progress. */
export function AdminOverviewCard({
  fullName,
  studentCount,
  classCount,
  vocabCount,
  pendingWritingCount,
  locale,
  dict,
}: {
  fullName: string;
  studentCount: number;
  classCount: number;
  vocabCount: number;
  pendingWritingCount: number;
  locale: Locale;
  dict: Dictionary;
}) {
  const hasPending = pendingWritingCount > 0;
  const todayLabel = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {dict.adminDashboard.heroLabel}
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-50">
            {formatMessage(dict.adminDashboard.greeting, { name: fullName })}
          </h1>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {todayLabel}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        <NatureHeroIllustration className="h-40 w-full dark:opacity-90 dark:brightness-90 sm:h-48" />

        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-md backdrop-blur-md dark:bg-neutral-900/92">
          <div
            className={
              hasPending
                ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                : "flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
            }
          >
            {hasPending ? <AlertCircle className="size-5" /> : <CheckCircle2 className="size-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {hasPending ? dict.adminDashboard.statusPending : dict.adminDashboard.statusClear}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasPending
                ? formatMessage(dict.adminDashboard.statusPendingDesc, { count: pendingWritingCount })
                : dict.adminDashboard.statusClearDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {dict.adminDashboard.overviewTitle}
        </p>

        <div className="flex flex-col divide-y divide-emerald-100 rounded-2xl bg-white/70 dark:divide-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <Users className="size-4" />
              </div>
              <span className="text-sm text-foreground">{dict.adminDashboard.students}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">{studentCount}</span>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                <Building2 className="size-4" />
              </div>
              <span className="text-sm text-foreground">{dict.adminDashboard.classes}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">{classCount}</span>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                <Library className="size-4" />
              </div>
              <span className="text-sm text-foreground">{dict.adminDashboard.vocabulary}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">{vocabCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
