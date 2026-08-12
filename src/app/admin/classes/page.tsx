import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { listClassesWithCountsAction } from "@/lib/actions/classes";
import { getCurrentAccount } from "@/lib/session";
import { AdminClassesClient } from "./classes-client";

export default async function AdminClassesPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (account.role !== "admin") return <AdminOnlyDenied />;

  const initialClasses = await listClassesWithCountsAction();
  return <AdminClassesClient initialClasses={initialClasses} />;
}
