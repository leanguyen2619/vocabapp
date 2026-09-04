import Link from "next/link";
import Image from "next/image";
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
      {/* Full-page background image (a misty, fairy-tale forest clearing) behind header, hero and
          footer alike — replaces the earlier CSS-gradient wash. Header/footer keep only their
          existing border, no background of their own, so the image shows through behind them too.
          A dark scrim is layered on top in dark mode only — the source image is pale enough that
          it would look like a jarring bright rectangle on an otherwise near-black page without one.
          Deliberately no negative z-index: body has `bg-background`, which CSS promotes to the
          *canvas* background — painted beneath literally everything, including negative-z-index
          elements anywhere in the document. DOM order (this div comes first, before header) is
          enough to keep it behind everything else without that trap. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <Image src="/forest-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 hidden dark:block dark:bg-black/60" />
      </div>

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
