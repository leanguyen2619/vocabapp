import { redirect } from "next/navigation";

import { getMyWarmupStatusAction } from "@/lib/actions/warmup";

/**
 * Call at the top of every student-facing page, right after the login check. No-ops for
 * non-students. Redirects to /warmup if today's mandatory 3 exercises aren't all done yet — the
 * /warmup page itself must never call this (it would redirect to itself).
 */
export async function requireWarmupComplete(): Promise<void> {
  const status = await getMyWarmupStatusAction();
  if (!status) return;
  const remaining = status.types.filter((t) => !status.completed.includes(t));
  if (remaining.length > 0) redirect("/warmup");
}
