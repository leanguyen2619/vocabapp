import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { listClassesAction } from "@/lib/actions/classes";
import { getMyLevelsAction } from "@/lib/actions/levels";
import { getMyWarmupStatusAction } from "@/lib/actions/warmup";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { redirectIfWarmupIncomplete } from "@/lib/warmup-guard";
import { ProfileClient } from "./profile-client";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.pageTitles.profile };
}

export default async function ProfilePage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const isStudent = account.role === "student";
  const [warmupStatus, levels, classes, dict] = await Promise.all([
    getMyWarmupStatusAction(),
    isStudent ? getMyLevelsAction() : Promise.resolve([]),
    listClassesAction(),
    getDictionary(await getLocale()),
  ]);
  redirectIfWarmupIncomplete(warmupStatus);
  const className = classes.find((c) => c.id === account.classId)?.className ?? null;

  return <ProfileClient account={account} levels={levels} className={className} dict={dict} />;
}
