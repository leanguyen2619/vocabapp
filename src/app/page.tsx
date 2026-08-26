import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";

import { FeatureCarousel } from "@/components/feature-carousel";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/locale";
import { getCurrentAccount } from "@/lib/session";

export default async function Home() {
  const [account, locale] = await Promise.all([getCurrentAccount(), getLocale()]);
  if (account) redirect("/dashboard");
  const dict = getDictionary(locale);

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-6 py-4 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-4" />
            </div>
            <span className="font-heading text-lg font-semibold">{dict.common.brand}</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <HeaderAuthActions account={account} dict={dict} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center"
          >
            <div className="h-96 w-3xl rounded-full bg-linear-to-r from-sky-200 via-violet-200 to-rose-200 opacity-50 blur-3xl dark:opacity-20" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-28">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {dict.landing.heroTitle}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground text-balance">
              {dict.landing.heroSubtitle}
            </p>
            <Button
              size="lg"
              className="h-11 rounded-full px-6 text-base"
              nativeButton={false}
              render={<Link href="/register" />}
            >
              {dict.landing.ctaRegister}
            </Button>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              {dict.landing.ctaTeacher}
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-24">
          <h2 className="mb-6 text-center font-heading text-2xl font-semibold tracking-tight sm:text-left">
            {dict.landing.featuresTitle}
          </h2>
          <FeatureCarousel dict={dict} />
        </section>
      </main>
    </div>
  );
}
