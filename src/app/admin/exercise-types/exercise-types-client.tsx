"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateExerciseTypeAction, type ExerciseTypeSummary } from "@/lib/actions/exercise-types";
import type { PracticeTypeCode } from "@/types";

export function AdminExerciseTypesClient({ initialTypes }: { initialTypes: ExerciseTypeSummary[] }) {
  const [types, setTypes] = useState(initialTypes);

  const patchLocal = (code: PracticeTypeCode, patch: Partial<ExerciseTypeSummary>) => {
    setTypes((current) => current.map((t) => (t.code === code ? { ...t, ...patch } : t)));
  };

  const commit = (code: PracticeTypeCode, patch: { name?: string; description?: string; enabled?: boolean; level?: number }) => {
    void updateExerciseTypeAction(code, patch);
  };

  return (
    <div className="flex flex-col gap-4">
      {types.map((type) => (
        <Card key={type.code}>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between gap-3">
              <Input
                value={type.name}
                onChange={(e) => patchLocal(type.code, { name: e.target.value })}
                onBlur={(e) => commit(type.code, { name: e.target.value })}
                className="max-w-64 font-medium"
              />
              <Switch
                checked={type.enabled}
                onCheckedChange={(checked) => {
                  patchLocal(type.code, { enabled: checked });
                  commit(type.code, { enabled: checked });
                  toast.success(`Đã ${checked ? "bật" : "tắt"} "${type.name}".`);
                }}
              />
            </div>

            <Textarea
              value={type.description}
              onChange={(e) => patchLocal(type.code, { description: e.target.value })}
              onBlur={(e) => commit(type.code, { description: e.target.value })}
              rows={2}
            />

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Cấp độ</Label>
              <Select
                value={String(type.level)}
                onValueChange={(value) => {
                  if (!value) return;
                  const level = Number(value);
                  patchLocal(type.code, { level });
                  commit(type.code, { level });
                }}
              >
                <SelectTrigger size="sm" className="w-24">
                  <SelectValue>{(value: string) => `Lv${value}`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((lv) => (
                    <SelectItem key={lv} value={String(lv)}>
                      Lv{lv}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!type.href && (
                <span className="ml-auto text-xs text-muted-foreground">
                  Chưa có giao diện bài tập
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
