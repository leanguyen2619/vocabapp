import { cookies } from "next/headers";

import { isLocale, type Locale } from "./dictionaries";

export const LOCALE_COOKIE_NAME = "vocabapp_locale";
export const DEFAULT_LOCALE: Locale = "vi";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}
