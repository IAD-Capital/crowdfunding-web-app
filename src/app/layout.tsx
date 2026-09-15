import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { DEFAULT_LOCALE } from "@/i18n";
import { getAppUrl } from "@/lib/mail";
import db from "@/lib/db";
import { FONT_VARIABLE_CLASSES, SITE_FONT_CSS_VAR } from "@/lib/fonts";
import { DEFAULT_SITE_FONT, isSiteFontKey, type SiteFontKey } from "@/lib/siteFonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: "IAD Capital - el nuevo crowdfunding inmobiliario",
  description: "Crowdfunding web app",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IAD Capital",
  },
};

export const viewport: Viewport = {
  themeColor: "#002539",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = headers().get("x-locale") ?? DEFAULT_LOCALE;

  // SELECT * so this keeps working even before migration 018 has added
  // site_font — the site just uses the default typography in that case.
  const [settings] = await db<{ site_font?: string }[]>`SELECT * FROM app_settings WHERE id = 1`;
  const siteFont: SiteFontKey = isSiteFontKey(settings?.site_font) ? settings.site_font : DEFAULT_SITE_FONT;
  const overrideVar = SITE_FONT_CSS_VAR[siteFont];

  return (
    <html
      lang={lang}
      className={FONT_VARIABLE_CLASSES}
      style={
        overrideVar
          ? ({ "--font-display": `var(${overrideVar})`, "--font-body": `var(${overrideVar})` } as React.CSSProperties)
          : undefined
      }
    >
      <body>{children}</body>
    </html>
  );
}
