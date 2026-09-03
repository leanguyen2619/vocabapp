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
          {/* Soft gradient wash behind the hero, colored to match the reindeer mascot (amber sky,
              moss ground, coral nose) rather than the site's pink brand tone, so the two feel like
              one scene instead of a mascot dropped onto a plain white background. Two versions
              (swapped via dark:) since the light one's pastel intensity would look wrong on a dark
              page — Tailwind's dark: variant can't reach into an inline gradient, hence two divs.
              Deliberately no negative z-index: body has `bg-background`, which CSS promotes to the
              *canvas* background — painted beneath literally everything, including negative-z-index
              elements anywhere in the document, not just this section's own stacking context. DOM
              order (both divs come before the z-10 content) is enough to keep them behind the text. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 dark:hidden"
            style={{
              background:
                "radial-gradient(50% 45% at 50% 0%, #fdedcf 0%, rgba(253,237,207,0) 70%)," +
                "radial-gradient(28% 24% at 8% 42%, rgba(220,239,200,0.55) 0%, rgba(220,239,200,0) 75%)," +
                "radial-gradient(26% 22% at 94% 6%, rgba(249,214,207,0.5) 0%, rgba(249,214,207,0) 75%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden dark:block"
            style={{
              background:
                "radial-gradient(50% 45% at 50% 0%, rgba(217,163,63,0.22) 0%, rgba(217,163,63,0) 70%)," +
                "radial-gradient(28% 24% at 8% 42%, rgba(122,159,94,0.14) 0%, rgba(122,159,94,0) 75%)," +
                "radial-gradient(26% 22% at 94% 6%, rgba(196,103,90,0.14) 0%, rgba(196,103,90,0) 75%)",
            }}
          />

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
