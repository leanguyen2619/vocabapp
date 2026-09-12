"use client";

import { useState } from "react";
import { SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { skipWarmupAction } from "@/lib/actions/warmup";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** TEMPORARY — lets a student skip today's mandatory warmup entirely. Remove alongside
 * skipWarmupAction once this stopgap is no longer needed. */
export function SkipWarmupButton({ dict }: { dict: Dictionary }) {
  const [pending, setPending] = useState(false);

  const handleSkip = async () => {
    setPending(true);
    await skipWarmupAction();
    // A hard navigation, not router.push — /dashboard was very likely already visited once this
    // session (the very redirect that landed the student on /warmup), and Next's client router
    // cache can replay that stale "still incomplete, redirect to /warmup" RSC response instead of
    // re-checking the now-updated status. A full reload always re-renders the destination fresh.
    window.location.href = "/dashboard";
  };

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => void handleSkip()}>
      <SkipForward className="size-3.5" />
      {dict.warmup.skipButton}
    </Button>
  );
}
