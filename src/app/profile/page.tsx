import { redirect } from "next/navigation";

import { listClassesAction } from "@/lib/actions/classes";
import { getMyLevelsAction } from "@/lib/actions/levels";
import { getCurrentAccount } from "@/lib/session";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const [levels, classes] = await Promise.all([getMyLevelsAction(), listClassesAction()]);
  const className = classes.find((c) => c.id === account.classId)?.className ?? null;

  return <ProfileClient account={account} levels={levels} className={className} />;
}
