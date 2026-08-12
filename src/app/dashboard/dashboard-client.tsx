"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Flame, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import type { Account } from "@/types";

export function DashboardShell({
  account,
  streak,
  children,
}: {
  account: Account;
  streak: number;
  children: ReactNode;
}) {
  const router = useRouter();

  const initials = account.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/");
    router.refresh();
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}
