import { Suspense } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

import { LanguageToggle } from "@/components/language-toggle";
import { RegisterForm } from "@/components/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";

export default async function RegisterPage() {
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
        <LanguageToggle />
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">{dict.register.title}</CardTitle>
          <CardDescription>{dict.register.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <RegisterForm dict={dict} />
          </Suspense>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {dict.register.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {dict.register.loginNow}
        </Link>
      </p>
    </div>
  );
}
