"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, PenLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  gradeWritingSubmissionAction,
  type GradedSubmissionItem,
  type PendingSubmissionItem,
} from "@/lib/actions/writing-submissions";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

function scoreColorClasses(score: number): string {
  if (score >= 80) return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-400";
  if (score >= 50) return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-400";
  return "border-red-300 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-400";
}

export function AdminWritingSubmissionsClient({
  initialPending,
  graded: initialGraded,
  dict,
}: {
  initialPending: PendingSubmissionItem[];
  graded: GradedSubmissionItem[];
  dict: Dictionary;
}) {
  const [pending, setPending] = useState(initialPending);
  const [graded, setGraded] = useState(initialGraded);
  const [target, setTarget] = useState<PendingSubmissionItem | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);

  const openGrade = (item: PendingSubmissionItem) => {
    setTarget(item);
    setScore("");
    setFeedback("");
    setError(null);
  };

  const handleGrade = async () => {
    if (!target) return;
    const parsed = Number(score);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      setError(dict.adminWriting.scoreRangeError);
      return;
    }
    setGrading(true);
    const result = await gradeWritingSubmissionAction(target.id, parsed, feedback);
    setGrading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setPending((prev) => prev.filter((p) => p.id !== target.id));
    setGraded((prev) => [
      { ...target, score: parsed, feedback: feedback.trim() || null, gradedAt: new Date() },
      ...prev,
    ]);
    toast.success(formatMessage(dict.adminWriting.gradeSuccess, { name: target.studentName }));
    setTarget(null);
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
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

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{dict.adminWriting.title}</h1>
          <p className="text-muted-foreground">{dict.adminWriting.subtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-amber-500" />
              {formatMessage(dict.adminWriting.pendingTitle, { count: pending.length })}
            </CardTitle>
            <CardDescription>{dict.adminWriting.pendingDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {pending.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{dict.adminWriting.noPending}</p>
            )}
            {pending.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.studentName}</span>
                      <Badge variant="secondary">
                        {item.vocab} — {item.meanVI}
                      </Badge>
                    </div>
                    <p className="max-w-xl rounded-lg bg-muted p-3 text-sm italic">“{item.sentence}”</p>
                  </div>
                  <Button size="sm" className="shrink-0" onClick={() => openGrade(item)}>
                    <PenLine className="size-3.5" />
                    {dict.adminWriting.gradeButton}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {dict.adminWriting.gradedTitle}
            </CardTitle>
            <CardDescription>{dict.adminWriting.gradedDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {graded.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{dict.adminWriting.noGraded}</p>
            )}
            {graded.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.studentName}</span>
                      <Badge variant="secondary">
                        {item.vocab} — {item.meanVI}
                      </Badge>
                    </div>
                    <p className="max-w-xl rounded-lg bg-muted p-3 text-sm italic">“{item.sentence}”</p>
                    {item.feedback && <p className="text-sm text-muted-foreground">{item.feedback}</p>}
                  </div>
                  <Badge className={cn("shrink-0 border text-sm font-semibold", scoreColorClasses(item.score))}>
                    {item.score}/100
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.adminWriting.dialogTitle}</DialogTitle>
            <DialogDescription>
              {target && formatMessage(dict.adminWriting.dialogDesc, { name: target.studentName, word: target.vocab })}
            </DialogDescription>
          </DialogHeader>

          {target && <p className="rounded-lg bg-muted p-3 text-sm italic">“{target.sentence}”</p>}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="writingScore">{dict.adminWriting.scoreInputLabel}</Label>
            <Input
              id="writingScore"
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="0-100"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="writingFeedback">{dict.adminWriting.feedbackInputLabel}</Label>
            <Textarea
              id="writingFeedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={dict.adminWriting.feedbackPlaceholder}
              rows={3}
              maxLength={1000}
            />
          </div>

          <DialogFooter>
            <Button disabled={!score.trim() || grading} onClick={() => void handleGrade()}>
              {dict.adminWriting.submitGrade}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
