import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { LevelWithProgress } from "@/types";

export function LevelCard({ level, dict }: { level: LevelWithProgress; dict: Dictionary }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{level.level}</CardTitle>
          {level.status === "completed" && <Trophy className="size-4 text-amber-500" />}
        </div>
        <CardDescription>
          {level.masteredVocab}/{level.totalVocab} {dict.common.wordsMastered}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {level.status === "locked" ? (
          <Badge variant="secondary">{dict.common.notUnlocked}</Badge>
        ) : (
          <Progress value={level.score}>
            <ProgressLabel>{dict.common.score}</ProgressLabel>
            <span className="ml-auto text-sm text-muted-foreground tabular-nums">
              {level.score}%
            </span>
          </Progress>
        )}
      </CardContent>
    </Card>
  );
}
