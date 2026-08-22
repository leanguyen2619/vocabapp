import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { SessionAccount } from "@/lib/session";

export function HeaderAuthActions({
  account,
  dict,
}: {
  account: SessionAccount | null;
  dict: Dictionary;
}) {
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
          {dict.landing.goToDashboard}
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
        {dict.landing.ctaLogin}
      </Button>
      <Button
        size="sm"
        className="rounded-full px-4"
        nativeButton={false}
        render={<Link href="/register" />}
      >
        {dict.register.submit}
      </Button>
    </div>
  );
}
