import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Schibsted_Grotesk, Hanken_Grotesk } from "next/font/google";
import { DEFAULT_LOCALE } from "@/i18n";
import "./globals.css";

const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = headers().get("x-locale") ?? DEFAULT_LOCALE;

  return (
    <html lang={lang} className={`${schibstedGrotesk.variable} ${hankenGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
