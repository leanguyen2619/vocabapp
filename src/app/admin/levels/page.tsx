import { redirect } from "next/navigation";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import { getAccountLevelStatusesAction, listLevelsAction, listStudentsAction } from "@/lib/actions/levels";
import { getCurrentAccount } from "@/lib/session";
import { AdminLevelsClient } from "./levels-client";

export default async function AdminLevelsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  if (account.role !== "admin") return <AdminOnlyDenied />;

  const [students, levels] = await Promise.all([listStudentsAction(), listLevelsAction()]);
  const initialStatusMap = students[0] ? await getAccountLevelStatusesAction(students[0].id_login) : {};

  return (
    <AdminLevelsClient students={students} levels={levels} initialStatusMap={initialStatusMap} />
  );
}
