import { redirect } from "next/navigation";

import type { WarmupStatus } from "@/lib/actions/warmup";

/**
 * Takes an ALREADY-FETCHED status — call getMyWarmupStatusAction() inside the page's own
 * Promise.all alongside its other data fetches (not awaited separately first), then pass the
 * result here once everything has resolved. Redirects to /warmup if today's mandatory 3
 * exercises aren't all done yet. No-ops for non-students (status is null). The /warmup page
 * itself must never call this (it would redirect to itself).
 */
export function redirectIfWarmupIncomplete(status: WarmupStatus | null): void {
  if (!status) return;
  const remaining = status.types.filter((t) => !status.completed.includes(t));
  if (remaining.length > 0) redirect("/warmup");
}
