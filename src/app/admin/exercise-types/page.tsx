import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { LogoMark } from "@/components/logo-mark";
import { listExerciseTypesAction } from "@/lib/actions/exercise-types";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { AdminExerciseTypesClient } from "./exercise-types-client";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.admin.exerciseTypes.title };
}

export default async function ExerciseTypesSettingsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

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
            {dict.common.backToDashboard}
          </Link>
          <div className="flex items-center gap-2">
            <LogoMark size="sm" />
            <span className="font-heading text-base font-semibold">{dict.common.brand}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {dict.admin.exerciseTypes.title}
          </h1>
          <p className="text-muted-foreground">{dict.admin.exerciseTypes.subtitle}</p>
        </div>

        <AdminExerciseTypesClient initialTypes={initialTypes} dict={dict} />
      </main>
    </div>
  );
}
