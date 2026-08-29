import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLocale());
  return { title: dict.login.title };
}

export default async function LoginPage() {
  const dict = getDictionary(await getLocale());

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-background px-6 py-16">
      <div className="flex w-full max-w-sm items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </div>
          <span className="font-heading text-lg font-semibold">{dict.common.brand}</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{dict.login.title}</CardTitle>
          <CardDescription>{dict.login.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm dict={dict} />
        </CardContent>
      </Card>
    </div>
  );
}
