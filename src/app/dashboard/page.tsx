"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Flame, LogOut } from "lucide-react";

import { AdminDashboardContent } from "@/components/admin-dashboard-content";
import { StudentDashboardContent } from "@/components/student-dashboard-content";
import { TeacherDashboardContent } from "@/components/teacher-dashboard-content";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRequireSession } from "@/hooks/use-session";
import { levels } from "@/lib/mock-data";

const activeLevel = levels.find((level) => level.status === "in_progress");
const streak = activeLevel?.streak ?? 0;

export default function DashboardPage() {
  const router = useRouter();
  const { account, status, logout } = useRequireSession();

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

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-4" />
            </div>
            <span className="font-heading text-lg font-semibold">VocabApp</span>
          </Link>
          <div className="flex items-center gap-3">
            {account.role === "student" && (
              <Badge variant="outline" className="gap-1">
                <Flame className="size-3 text-orange-500" />
                {streak} ngày
              </Badge>
            )}
            <Link href="/profile" aria-label="Hồ sơ cá nhân">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="ghost" size="icon-sm" aria-label="Đăng xuất" onClick={handleLogout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        {account.role === "admin" ? (
          <AdminDashboardContent account={account} />
        ) : account.role === "teacher" ? (
          <TeacherDashboardContent account={account} />
        ) : (
          <StudentDashboardContent account={account} />
        )}
      </main>
    </div>
  );
}
