"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, LogOut, UserRound } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/logo-mark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";
import { getInitials } from "@/lib/utils";
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
  const { dict } = useLocale();

  const initials = getInitials(account.fullName);

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
            <LogoMark size="md" />
            <span className="font-heading text-lg font-semibold">{dict.common.brand}</span>
          </Link>
          <div className="flex items-center gap-3">
            {account.role === "student" && (
              <Badge variant="outline" className="gap-1">
                <Flame className="size-3 text-orange-500" />
                {streak} {dict.dashboard.streakDays}
              </Badge>
            )}
            <ThemeToggle />
            <LanguageToggle />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<button type="button" aria-label={dict.common.profile} className="rounded-full" />}
              >
                <Avatar>
                  {account.avatarUrl && <AvatarImage src={account.avatarUrl} alt={account.fullName} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <UserRound className="size-4" />
                  {dict.common.profile}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                  <LogOut className="size-4" />
                  {dict.common.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">{children}</main>
    </div>
  );
}
