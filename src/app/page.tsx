import Link from "next/link";
import { redirect } from "next/navigation";
import {} from "lucide-react";

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
    <div className="relative flex flex-1 flex-col bg-background">
      {/* Colorful gradient wash for the WHOLE page (header, hero, footer) — matching the reindeer
          mascot's own palette (amber sky, moss ground, coral nose, a warm gold accent) rather than
          the site's pink brand tone, so the two feel like one scene instead of a colorful hero
          sandwiched between plain white bands. Header/footer keep only their existing border, no
          background of their own, so this shows through behind them too. Two versions (swapped via
          dark:) since the light one's intensity would look wrong on a dark page — Tailwind's dark:
          variant can't reach into an inline gradient, hence two divs. Deliberately no negative
          z-index: body has `bg-background`, which CSS promotes to the *canvas* background — painted
          beneath literally everything, including negative-z-index elements anywhere in the
          document. DOM order (both divs come first, before header) is enough to keep them behind
          everything else without that trap. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(45% 38% at 50% 0%, #fdecc7 0%, rgba(253,236,199,0.45) 42%, rgba(253,236,199,0) 85%)," +
            "radial-gradient(38% 34% at 0% 40%, #d9ecc0 0%, rgba(217,236,192,0.4) 45%, rgba(217,236,192,0) 85%)," +
            "radial-gradient(38% 34% at 100% 20%, #f8d2c9 0%, rgba(248,210,201,0.4) 45%, rgba(248,210,201,0) 85%)," +
            "radial-gradient(34% 30% at 78% 62%, #f6e2ae 0%, rgba(246,226,174,0.35) 45%, rgba(246,226,174,0) 85%)," +
            "radial-gradient(36% 28% at 15% 92%, #f8d2c9 0%, rgba(248,210,201,0.3) 45%, rgba(248,210,201,0) 85%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(45% 38% at 50% 0%, rgba(217,163,63,0.32) 0%, rgba(217,163,63,0) 80%)," +
            "radial-gradient(38% 34% at 0% 40%, rgba(122,159,94,0.24) 0%, rgba(122,159,94,0) 80%)," +
            "radial-gradient(38% 34% at 100% 20%, rgba(196,103,90,0.24) 0%, rgba(196,103,90,0) 80%)," +
            "radial-gradient(34% 30% at 78% 62%, rgba(196,150,63,0.2) 0%, rgba(196,150,63,0) 80%)," +
            "radial-gradient(36% 28% at 15% 92%, rgba(196,103,90,0.18) 0%, rgba(196,103,90,0) 80%)",
        }}
      />

      <header className="relative border-b border-border">
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

      <main className="relative flex flex-1 flex-col">
        <section>
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 pt-14 pb-24 text-center sm:pt-16 sm:pb-28">
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
      </main>

      <footer className="relative border-t border-border">
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
