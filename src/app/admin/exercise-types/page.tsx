"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, ShieldAlert } from "lucide-react";

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
import { useExerciseTypes } from "@/hooks/use-exercise-types";
import { useRequireSession } from "@/hooks/use-session";

export default function ExerciseTypesSettingsPage() {
  const { account, status } = useRequireSession();
  const { types, loaded, updateType } = useExerciseTypes();

  if (status !== "authenticated" || !account) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (account.role !== "admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">Chỉ quản trị viên mới có quyền truy cập trang này.</p>
        <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
          Về Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-3.5" />
            </div>
            <span className="font-heading text-base font-semibold">VocabApp</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Quản lý dạng bài tập
          </h1>
          <p className="text-muted-foreground">
            Bật/tắt và chỉnh sửa tên, mô tả, cấp độ của từng dạng bài tập học sinh sẽ thấy.
          </p>
        </div>

        {loaded && (
          <div className="flex flex-col gap-4">
            {types.map((type) => (
              <Card key={type.code}>
                <CardContent className="flex flex-col gap-3 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      value={type.name}
                      onChange={(e) => updateType(type.code, { name: e.target.value })}
                      className="max-w-64 font-medium"
                    />
                    <Switch
                      checked={type.enabled}
                      onCheckedChange={(checked) => {
                        updateType(type.code, { enabled: checked });
                        toast.success(`Đã ${checked ? "bật" : "tắt"} "${type.name}".`);
                      }}
                    />
                  </div>

                  <Textarea
                    value={type.description}
                    onChange={(e) => updateType(type.code, { description: e.target.value })}
                    rows={2}
                  />

                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Cấp độ</Label>
                    <Select
                      value={String(type.level)}
                      onValueChange={(value) =>
                        updateType(type.code, { level: Number(value) as 1 | 2 | 3 | 4 })
                      }
                    >
                      <SelectTrigger size="sm" className="w-24">
                        <SelectValue />
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
        )}
      </main>
    </div>
  );
}
