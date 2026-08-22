"use client";

import { useRouter } from "next/navigation";
import { Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExerciseTypeSummary } from "@/lib/actions/exercise-types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PracticeTypeCode } from "@/types";

export function RandomExerciseButton({
  currentCode,
  types,
  dict,
}: {
  currentCode: PracticeTypeCode;
  types: ExerciseTypeSummary[];
  dict: Dictionary;
}) {
  const router = useRouter();

  const handleRefresh = () => {
    const candidates = types.filter((t) => t.enabled && t.href && t.code !== currentCode);
    if (candidates.length === 0) return;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    router.push(pick.href!);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleRefresh}>
      <Shuffle className="size-4" />
      {dict.exercises.changeType}
    </Button>
  );
}
