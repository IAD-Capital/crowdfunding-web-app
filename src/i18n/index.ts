import type { Dictionary } from "./dictionaries/es";

export type { Dictionary };
export type Locale = "es" | "en";
export const LOCALES: Locale[] = ["es", "en"];
export const DEFAULT_LOCALE: Locale = "es";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  es: () => import("./dictionaries/es").then((m) => m.default),
  en: () => import("./dictionaries/en").then((m) => m.default),
};

export function getDictionary(locale: Locale): Promise<Dictionary> {
  return (dictionaries[locale] ?? dictionaries.es)();
}

export function isValidLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
