import { redirect } from "next/navigation";

import { listClassesAction } from "@/lib/actions/classes";
import { getMyLevelsAction } from "@/lib/actions/levels";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";
import { requireWarmupComplete } from "@/lib/warmup-guard";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  await requireWarmupComplete();

  const [levels, classes, dict] = await Promise.all([
    getMyLevelsAction(),
    listClassesAction(),
    getDictionary(await getLocale()),
  ]);
  const className = classes.find((c) => c.id === account.classId)?.className ?? null;

  return <ProfileClient account={account} levels={levels} className={className} dict={dict} />;
}
