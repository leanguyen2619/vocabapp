"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { WeakWordItem } from "@/lib/actions/class-report";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

function percentColorClasses(percent: number): string {
  if (percent >= 70) return "border-red-300 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400";
  if (percent >= 40) return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-400";
  return "border-border bg-muted text-muted-foreground";
}

export function ClassReportClient({ weakWords, dict }: { weakWords: WeakWordItem[]; dict: Dictionary }) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {dict.common.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{dict.classReport.title}</h1>
          <p className="text-muted-foreground">{dict.classReport.subtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="size-4 text-red-500" />
              {dict.classReport.listTitle}
            </CardTitle>
            <CardDescription>{dict.classReport.listDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {weakWords.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{dict.classReport.empty}</p>
            )}
            {weakWords.map((w, index) => (
              <div key={w.vocabId}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{w.vocab}</span>
                      <span className="text-sm text-muted-foreground">— {w.meanVI}</span>
                      <Badge variant="secondary">{w.levelName}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatMessage(dict.classReport.attemptedLabel, { count: w.attempted })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 sm:w-48">
                    <Progress value={w.notMasteredPercent} className="flex-1" />
                    <Badge className={cn("shrink-0 border", percentColorClasses(w.notMasteredPercent))}>
                      {formatMessage(dict.classReport.percentLabel, {
                        count: w.notMasteredCount,
                        total: w.attempted,
                        percent: w.notMasteredPercent,
                      })}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
