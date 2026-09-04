"use client";

import { useMemo, useState } from "react";
import { Clock, MessageSquare } from "lucide-react";

import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";
import type { MySubmissionItem } from "@/lib/actions/writing-submissions";

const PAGE_SIZE = 10;

function scoreColorClasses(score: number): string {
  if (score >= 80) return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-400";
  if (score >= 50) return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-400";
  return "border-red-300 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400";
}

export function WritingResultsClient({
  submissions,
  dict,
}: {
  submissions: MySubmissionItem[];
  dict: Dictionary;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | "graded" | "pending">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => (statusFilter === "all" ? submissions : submissions.filter((s) => s.status === statusFilter)),
    [submissions, statusFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{dict.writingResults.title}</h1>
        <p className="text-muted-foreground">{dict.writingResults.subtitle}</p>
      </div>

      {submissions.length > 0 && (
        <Tabs
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as "all" | "graded" | "pending");
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">{dict.writingResults.allFilter}</TabsTrigger>
            <TabsTrigger value="graded">{dict.writingResults.gradedFilter}</TabsTrigger>
            <TabsTrigger value="pending">{dict.writingResults.pendingFilter}</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <Card>
        <CardContent className="flex flex-col gap-1 py-4">
          {submissions.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{dict.writingResults.empty}</p>
          )}
          {submissions.length > 0 && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">{dict.writingResults.noResults}</p>
          )}
          {paged.map((s, index) => (
            <div key={s.id}>
              {index > 0 && <Separator className="my-3" />}
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{s.vocab}</p>
                    <p className="text-sm text-muted-foreground">{s.meanVI}</p>
                  </div>
                  {s.status === "pending" ? (
                    <Badge variant="outline" className="shrink-0 gap-1">
                      <Clock className="size-3" />
                      {dict.writingResults.pendingBadge}
                    </Badge>
                  ) : (
                    <Badge className={cn("shrink-0 gap-1 border text-sm font-semibold", scoreColorClasses(s.score!))}>
                      {s.score}/100
                    </Badge>
                  )}
                </div>
                <p className="rounded-lg bg-muted p-3 text-sm italic">“{s.sentence}”</p>
                {s.status === "graded" && s.feedback && (
                  <div className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
                    <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p>{s.feedback}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} dict={dict} />
    </div>
  );
}
