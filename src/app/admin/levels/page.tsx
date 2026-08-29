import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AdminOnlyDenied } from "@/components/admin-only-denied";
import {
  getAccountLevelStatusesAction,
  listLevelsAction,
  listLevelUnlockCandidatesAction,
  listStudentsAction,
} from "@/lib/actions/levels";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { AdminLevelsClient } from "./levels-client";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.admin.levels.title };
}

export default async function AdminLevelsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const dict = getDictionary(await getLocale());
  if (account.role !== "admin") return <AdminOnlyDenied dict={dict} />;

  const [students, levels, unlockCandidates] = await Promise.all([
    listStudentsAction(),
    listLevelsAction(),
    listLevelUnlockCandidatesAction(),
  ]);
  const initialEntries = students[0] ? await getAccountLevelStatusesAction(students[0].id_login) : {};

  return (
    <AdminLevelsClient
      students={students}
      levels={levels}
      initialEntries={initialEntries}
      unlockCandidates={unlockCandidates}
      dict={dict}
    />
  );
}
