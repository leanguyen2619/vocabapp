import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { SessionAccount } from "@/lib/session";

export function HeaderAuthActions({ account }: { account: SessionAccount | null }) {
  if (account) {
    const initials = account.fullName
      .split(" ")
      .map((part) => part[0])
      .slice(-2)
      .join("")
      .toUpperCase();

    return (
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" className="rounded-full px-4" nativeButton={false} render={<Link href="/dashboard" />}>
          Vào Dashboard
        </Button>
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />}>
        Đăng nhập
      </Button>
      <Button
        size="sm"
        className="rounded-full px-4"
        nativeButton={false}
        render={<Link href="/register" />}
      >
        Đăng ký
      </Button>
    </div>
  );
}
