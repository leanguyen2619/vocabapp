import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getCurrentAccount } from "@/lib/session";
import { AdminExerciseTypesClient } from "./exercise-types-client";

export default async function ExerciseTypesSettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (account.role !== "admin") return <AdminOnlyDenied />;

  const initialTypes = await listExerciseTypesAction();

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Quản lý dạng bài tập
          </h1>
          <p className="text-muted-foreground">
            Bật/tắt và chỉnh sửa tên, mô tả, cấp độ của từng dạng bài tập học sinh sẽ thấy.
          </p>
        </div>

        <AdminExerciseTypesClient initialTypes={initialTypes} />
      </main>
    </div>
  );
}
