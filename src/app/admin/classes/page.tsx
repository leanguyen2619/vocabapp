import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listClassesWithCountsAction } from "@/lib/actions/classes";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { AdminClassesClient } from "./classes-client";

export default async function AdminClassesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const initialClasses = await listClassesWithCountsAction();
  return <AdminClassesClient initialClasses={initialClasses} dict={dict} />;
}
