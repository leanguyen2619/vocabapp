"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import type { Locale } from "@/lib/i18n/dictionaries";

export async function setLocaleAction(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
