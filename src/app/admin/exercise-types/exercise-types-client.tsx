"use client";

import { useRef, useState } from "react";
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
import { formatMessage } from "@/lib/i18n/format";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { PracticeTypeCode } from "@/types";

export function AdminExerciseTypesClient({
  initialTypes,
  dict,
}: {
  initialTypes: ExerciseTypeSummary[];
  dict: Dictionary;
}) {
  const [types, setTypes] = useState(initialTypes);
  // Text inputs re-render on every keystroke, so `type.name`/`type.description` in a blur
  // handler's closure is already the just-typed value by the time blur fires — not what was
  // there before this edit. Snapshotting on focus captures the true pre-edit value to revert to.
  const beforeEditRef = useRef<Record<string, string>>({});

  const patchLocal = (code: PracticeTypeCode, patch: Partial<ExerciseTypeSummary>) => {
    setTypes((current) => current.map((t) => (t.code === code ? { ...t, ...patch } : t)));
  };

  const commit = async (
    code: PracticeTypeCode,
    patch: { name?: string; description?: string; enabled?: boolean; level?: number },
    previous: Partial<ExerciseTypeSummary>
  ): Promise<boolean> => {
    const ok = await updateExerciseTypeAction(code, patch);
    if (!ok) {
      patchLocal(code, previous);
      toast.error(dict.admin.exerciseTypes.saveError);
    }
    return ok;
  };

  return (
    <div className="flex flex-col gap-4">
      {types.map((type) => (
        <Card key={type.code}>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center justify-between gap-3">
              <Input
                value={type.name}
                onFocus={() => {
                  beforeEditRef.current[`${type.code}:name`] ??= type.name;
                }}
                onChange={(e) => patchLocal(type.code, { name: e.target.value })}
                onBlur={(e) => {
                  const previous = beforeEditRef.current[`${type.code}:name`] ?? type.name;
                  delete beforeEditRef.current[`${type.code}:name`];
                  void commit(type.code, { name: e.target.value }, { name: previous });
                }}
                className="max-w-64 font-medium"
              />
              <Switch
                checked={type.enabled}
                onCheckedChange={(checked) => {
                  const previousEnabled = type.enabled;
                  patchLocal(type.code, { enabled: checked });
                  void commit(type.code, { enabled: checked }, { enabled: previousEnabled }).then((ok) => {
                    if (!ok) return;
                    toast.success(
                      formatMessage(dict.admin.exerciseTypes.toggleSuccess, {
                        action: checked ? dict.admin.exerciseTypes.enable : dict.admin.exerciseTypes.disable,
                        name: type.name,
                      })
                    );
                  });
                }}
              />
            </div>

            <Textarea
              value={type.description}
              onFocus={() => {
                beforeEditRef.current[`${type.code}:description`] ??= type.description;
              }}
              onChange={(e) => patchLocal(type.code, { description: e.target.value })}
              onBlur={(e) => {
                const previous = beforeEditRef.current[`${type.code}:description`] ?? type.description;
                delete beforeEditRef.current[`${type.code}:description`];
                void commit(type.code, { description: e.target.value }, { description: previous });
              }}
              rows={2}
            />

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">{dict.admin.exerciseTypes.levelLabel}</Label>
              <Select
                value={String(type.level)}
                onValueChange={(value) => {
                  if (!value) return;
                  const level = Number(value);
                  const previousLevel = type.level;
                  patchLocal(type.code, { level });
                  void commit(type.code, { level }, { level: previousLevel });
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
                  {dict.admin.exerciseTypes.noUi}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
