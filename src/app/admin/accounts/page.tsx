import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listAccountsAction } from "@/lib/actions/accounts";
import { listClassesAction } from "@/lib/actions/classes";
import { listAllResetRequestsAction } from "@/lib/actions/password-reset-requests";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { AdminAccountsClient } from "./accounts-client";

export default async function AdminAccountsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const [initialAccounts, classes, resetRequests] = await Promise.all([
    listAccountsAction(),
    listClassesAction(),
    listAllResetRequestsAction(),
  ]);

  return (
    <AdminAccountsClient
      adminAccount={account}
      initialAccounts={initialAccounts}
      classes={classes}
      resetRequests={resetRequests}
      dict={dict}
    />
  );
}
