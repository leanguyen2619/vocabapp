import { Lock, Trophy } from "lucide-react";

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
import { cn } from "@/lib/utils";
import type { LevelWithProgress } from "@/types";

export function LevelCard({ level, dict }: { level: LevelWithProgress; dict: Dictionary }) {
  const isLocked = level.status === "locked";
  const isCompleted = level.status === "completed";

  return (
    <Card
      className={cn(
        "transition-colors",
        isLocked && "opacity-60",
        isCompleted &&
          "border-amber-300 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(isLocked && "text-muted-foreground")}>{level.level}</CardTitle>
          {isCompleted && (
            <div className="flex size-7 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <Trophy className="size-4 text-amber-500" />
            </div>
          )}
          {isLocked && <Lock className="size-4 text-muted-foreground" />}
        </div>
        <CardDescription>
          {level.masteredVocab}/{level.totalVocab} {dict.common.wordsMastered}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLocked ? (
          <Badge variant="secondary" className="gap-1">
            <Lock className="size-3" />
            {dict.common.notUnlocked}
          </Badge>
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
