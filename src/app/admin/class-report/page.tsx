import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { getClassWeakWordsReportAction } from "@/lib/actions/class-report";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { ClassReportClient } from "./class-report-client";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.classReport.title };
}

export default async function AdminClassReportPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const weakWords = await getClassWeakWordsReportAction();

  return <ClassReportClient weakWords={weakWords} dict={dict} />;
}
