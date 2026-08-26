"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { setLocaleAction } from "@/lib/actions/locale";
import { dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

interface LocaleContextValue {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Seeded from the server-read cookie so the first paint already matches the saved preference. */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    // Awaited by the caller before it triggers a router.refresh() — without this, the refresh's
    // server request could race the cookie write and re-render with the OLD locale, making the
    // toggle look broken/unresponsive until a second click.
    await setLocaleAction(next);
  }, []);

  const value = useMemo(
    () => ({ locale, dict: dictionaries[locale], setLocale }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
