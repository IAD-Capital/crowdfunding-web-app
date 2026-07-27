import { GoogleAnalytics } from '@next/third-parties/google';
import { Schibsted_Grotesk, Hanken_Grotesk } from "next/font/google";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  return (
    <html lang={lang} className={`${schibstedGrotesk.variable} ${hankenGrotesk.variable}`}>
      <body>{children}</body>
      {/* https://nextjs.org/docs/messages/next-script-for-ga */}
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ""} />
    </html>
  );
}
