import en from "./en";
import vi, { type Dictionary } from "./vi";

export const dictionaries = { vi, en };
export type Locale = keyof typeof dictionaries;
export type { Dictionary };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function isLocale(value: string): value is Locale {
  return value === "vi" || value === "en";
}
