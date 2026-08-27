import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import {
  listPendingWritingSubmissionsAction,
  listRecentlyGradedSubmissionsAction,
} from "@/lib/actions/writing-submissions";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { AdminWritingSubmissionsClient } from "./writing-submissions-client";

export default async function AdminWritingSubmissionsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const [pending, graded] = await Promise.all([
    listPendingWritingSubmissionsAction(),
    listRecentlyGradedSubmissionsAction(),
  ]);

  return <AdminWritingSubmissionsClient initialPending={pending} graded={graded} dict={dict} />;
}
