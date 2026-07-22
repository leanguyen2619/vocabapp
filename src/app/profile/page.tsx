"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Flame, GraduationCap, LogOut, Mail, Pencil, Trophy } from "lucide-react";

import { LevelCard } from "@/components/level-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRequireSession } from "@/hooks/use-session";
import { getEmailForAccount } from "@/lib/auth";
import { getClassName, levels } from "@/lib/mock-data";
import type { Role } from "@/types";

const roleLabel: Record<Role, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Quản trị viên",
};

export default function ProfilePage() {
  const router = useRouter();
  const { account, status, logout, updateProfile } = useRequireSession();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");

  if (status !== "authenticated" || !account) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  const initials = account.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const unlockedLevels = levels.filter((level) => level.status !== "locked");
  const totalMastered = unlockedLevels.reduce((sum, l) => sum + l.masteredVocab, 0);
  const totalVocab = unlockedLevels.reduce((sum, l) => sum + l.totalVocab, 0);
  const completedLevels = levels.filter((level) => level.status === "completed").length;
  const streak = Math.max(0, ...levels.map((level) => level.streak));
  const className = getClassName(account.classId);
  const email = getEmailForAccount(account.id_login);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const startEditing = () => {
    setFullName(account.fullName);
    setEditing(true);
  };

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Họ tên không được để trống.");
      return;
    }
    updateProfile({ fullName: fullName.trim() });
    setEditing(false);
    toast.success("Đã cập nhật hồ sơ.");
  };

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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-4 text-center sm:flex-row sm:items-start sm:text-left">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex flex-1 flex-col gap-2">
              {editing ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoFocus
                    className="max-w-56"
                  />
                  <div className="flex justify-center gap-2 sm:justify-start">
                    <Button size="sm" onClick={handleSave}>
                      Lưu
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="font-heading text-xl font-semibold tracking-tight">
                    {account.fullName}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Sửa họ tên"
                    onClick={startEditing}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="secondary">{roleLabel[account.role]}</Badge>
                {className && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <GraduationCap className="size-3.5" />
                    {className}
                  </span>
                )}
                {email && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="size-3.5" />
                    {email}
                  </span>
                )}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
              <LogOut className="size-4" />
              Đăng xuất
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-orange-500/10">
                <Flame className="size-4 text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-semibold leading-none">{streak}</p>
                <p className="text-xs text-muted-foreground">Ngày liên tiếp</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold leading-none">
                  {totalMastered}/{totalVocab}
                </p>
                <p className="text-xs text-muted-foreground">Từ đã thuộc</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/10">
                <Trophy className="size-4 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-semibold leading-none">{completedLevels}</p>
                <p className="text-xs text-muted-foreground">Cấp độ hoàn thành</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Tiến độ theo cấp độ</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {levels.map((level) => (
              <LevelCard key={level.id} level={level} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
