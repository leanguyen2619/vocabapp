import { CheckCircle2, Flame, PartyPopper, TrendingUp } from "lucide-react";
import Image from "next/image";

import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

/** The dashboard's hero section — a forest photo banner (matching the site-wide bg-forest
 * treatment) with a floating status card and a "Today's Overview" stat row, styled independently
 * of the rest of the app (a deliberately different, green/nature palette scoped to just this card
 * via explicit Tailwind color utilities — the shared --primary token elsewhere in the app is
 * untouched, so the rest of the site keeps its usual look). */
export function DashboardOverviewCard({
  fullName,
  wordsCompletedToday,
  wordsTotalToday,
  streak,
  currentLevelLabel,
  currentLevelScore,
  locale,
  dict,
}: {
  fullName: string;
  wordsCompletedToday: number;
  wordsTotalToday: number;
  streak: number;
  currentLevelLabel: string | null;
  currentLevelScore: number;
  locale: Locale;
  dict: Dictionary;
}) {
  const hasStarted = wordsCompletedToday > 0;
  const isAllDone = wordsTotalToday > 0 && wordsCompletedToday >= wordsTotalToday;
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
            {dict.studentDashboard.heroLabel}
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-50">
            {formatMessage(dict.studentDashboard.greeting, { name: fullName })}
          </h1>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {todayLabel}
        </span>
      </div>

      <div className="relative h-40 overflow-hidden rounded-2xl sm:h-48">
        <Image
          src="/forest-bg.jpg"
          alt=""
          fill
          sizes="(min-width: 640px) 600px, 100vw"
          className="object-cover dark:opacity-90 dark:brightness-75"
          priority
        />

        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-white/97 p-3 shadow-md backdrop-blur-md dark:bg-neutral-900/92">
          <div
            className={
              isAllDone
                ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
                : "flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
            }
          >
            {isAllDone ? <PartyPopper className="size-5" /> : <CheckCircle2 className="size-5" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isAllDone
                ? dict.studentDashboard.statusAllDone
                : hasStarted
                  ? dict.studentDashboard.statusOnTrack
                  : dict.studentDashboard.statusStart}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAllDone
                ? dict.studentDashboard.statusAllDoneDesc
                : hasStarted
                  ? dict.studentDashboard.statusOnTrackDesc
                  : dict.studentDashboard.statusStartDesc}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
          {dict.studentDashboard.overviewTitle}
        </p>

        <div className="flex flex-col divide-y divide-emerald-100 rounded-2xl bg-white/70 dark:divide-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
              </div>
              <span className="text-sm text-foreground">{dict.studentDashboard.statWordsToday}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {wordsCompletedToday}/{wordsTotalToday}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-900/40 dark:text-orange-400">
                <Flame className="size-4" />
              </div>
              <span className="text-sm text-foreground">{dict.studentDashboard.statStreak}</span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {formatMessage(dict.studentDashboard.statStreakValue, { count: streak })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                <TrendingUp className="size-4" />
              </div>
              <span className="text-sm text-foreground">
                {dict.studentDashboard.statLevelProgress}
                {currentLevelLabel ? ` (${currentLevelLabel})` : ""}
              </span>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">{currentLevelScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
