import Link from "next/link";
import { redirect } from "next/navigation";
import {} from "lucide-react";

import { FeatureCarousel } from "@/components/feature-carousel";
import { HeaderAuthActions } from "@/components/header-auth-actions";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";
import { WelcomeReindeerIllustration } from "@/components/welcome-reindeer-illustration";
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
            <LogoMark size="md" />
            <span className="font-heading text-lg font-semibold">{dict.common.brand}</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <HeaderAuthActions account={account} dict={dict} />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden">
          <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pt-14 pb-24 text-center sm:pt-16 sm:pb-28">
            <div className="w-full max-w-md overflow-hidden rounded-3xl shadow-sm">
              <WelcomeReindeerIllustration className="h-56 w-full sm:h-64" />
            </div>

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
              render={<Link href="/login" />}
            >
              {dict.landing.ctaLogin}
            </Button>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 pt-4 pb-24">
          <h2 className="mb-6 text-center font-heading text-2xl font-semibold tracking-tight sm:text-left">
            {dict.landing.featuresTitle}
          </h2>
          <FeatureCarousel dict={dict} />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-6 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} {dict.common.brand}. {dict.landing.footerRights}
          </p>
          <p>{dict.landing.footerTagline}</p>
        </div>
      </footer>
    </div>
  );
}
