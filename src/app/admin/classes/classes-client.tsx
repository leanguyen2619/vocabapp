"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, ArrowLeft, Plus, Trash2, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/pagination-controls";
import { LogoMark } from "@/components/logo-mark";
import {
  createClassAction,
  deleteClassAction,
  listClassesWithCountsAction,
  updateClassTargetAction,
  type ClassWithStudentCount,
} from "@/lib/actions/classes";
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function AdminClassesClient({
  initialClasses,
  dict,
}: {
  initialClasses: ClassWithStudentCount[];
  dict: Dictionary;
}) {
  const [classes, setClasses] = useState(initialClasses);
  // Local, uncommitted text per class's target input — lets an admin freely clear/retype the
  // field (a fully-controlled value bound straight to dailyWordTarget snaps back on every
  // invalid intermediate keystroke, e.g. while backspacing). Only sent to the server on blur.
  const [targetInputs, setTargetInputs] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [className, setClassName] = useState("");
  const [dailyWordTarget, setDailyWordTarget] = useState("5");
  const [error, setError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ClassWithStudentCount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(classes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedClasses = classes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetForm = () => {
    setClassName("");
    setDailyWordTarget("5");
    setError(null);
  };

  const handleCreate = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const target = Number(dailyWordTarget);
    const result = await createClassAction(className, target);
    if (result.error !== undefined) {
      setError(result.error);
      return;
    }

    const refreshed = await listClassesWithCountsAction();
    setClasses(refreshed);
    setPage(Math.max(1, Math.ceil(refreshed.length / PAGE_SIZE)));
    setDialogOpen(false);
    const createdName = className.trim();
    resetForm();
    toast.success(formatMessage(dict.admin.classes.createSuccess, { name: createdName }));
  };

  const handleTargetInputChange = (id: string, value: string) => {
    setTargetInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleTargetBlur = async (cls: ClassWithStudentCount) => {
    const raw = targetInputs[cls.id];
    if (raw === undefined) return;
    setTargetInputs((prev) => {
      const next = { ...prev };
      delete next[cls.id];
      return next;
    });

    const target = Number(raw);
    if (!Number.isInteger(target) || target <= 0) {
      toast.error(dict.admin.classes.errorTargetInvalid);
      return;
    }
    if (target === cls.dailyWordTarget) return;

    const ok = await updateClassTargetAction(cls.id, target);
    if (!ok) {
      toast.error(dict.admin.classes.targetSaveError);
      return;
    }
    setClasses((prev) => prev.map((c) => (c.id === cls.id ? { ...c, dailyWordTarget: target } : c)));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteClassAction(deleteTarget.id);
    setDeleting(false);

    if (result.error !== undefined) {
      setDeleteError(result.error);
      return;
    }

    setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success(formatMessage(dict.admin.classes.deleteSuccess, { name: deleteTarget.className }));
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-1 flex-col bg-background bg-forest">
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
            <LogoMark size="sm" />
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {dict.admin.classes.title}
            </h1>
            <p className="text-muted-foreground">{dict.admin.classes.subtitle}</p>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              {dict.admin.classes.createButton}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{dict.admin.classes.createTitle}</DialogTitle>
                <DialogDescription>{dict.admin.classes.createDesc}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} noValidate className="flex flex-col gap-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="className">{dict.admin.classes.nameLabel}</Label>
                  <Input
                    id="className"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder={dict.admin.classes.namePlaceholder}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dailyWordTarget">{dict.admin.classes.targetLabel}</Label>
                  <Input
                    id="dailyWordTarget"
                    type="number"
                    min={1}
                    value={dailyWordTarget}
                    onChange={(e) => setDailyWordTarget(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit">{dict.admin.classes.createSubmit}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-1 py-4">
            {pagedClasses.map((cls, index) => (
              <div key={cls.id}>
                {index > 0 && <div className="my-3 h-px bg-border" />}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{cls.className}</p>
                    <Badge variant="outline" className="mt-1 gap-1">
                      <Users className="size-3" />
                      {cls.studentCount} {dict.admin.classes.studentCount}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label htmlFor={`target-${cls.id}`} className="text-sm text-muted-foreground">
                      {dict.admin.classes.targetPerDay}
                    </Label>
                    <Input
                      id={`target-${cls.id}`}
                      type="number"
                      min={1}
                      value={targetInputs[cls.id] ?? cls.dailyWordTarget}
                      onChange={(e) => handleTargetInputChange(cls.id, e.target.value)}
                      onBlur={() => void handleTargetBlur(cls)}
                      className="w-20"
                    />
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={dict.common.delete}
                      onClick={() => {
                        setDeleteTarget(cls);
                        setDeleteError(null);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} dict={dict} />
      </main>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.admin.classes.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {formatMessage(dict.admin.classes.deleteConfirmDesc, {
                name: deleteTarget?.className ?? "",
              })}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {dict.common.cancel}
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              {dict.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
