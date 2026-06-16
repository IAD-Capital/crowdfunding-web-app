import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  return <html lang={lang}><body>{children}</body></html>;
}
