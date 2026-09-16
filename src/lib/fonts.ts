import { Schibsted_Grotesk, Hanken_Grotesk, Open_Sans, Inter, Poppins, Work_Sans, Manrope } from "next/font/google";
import type { SiteFontKey } from "./siteFonts";

// The site's default look: display font for headings, body font for everything
// else — both consumed via the --font-display / --font-body CSS variables
// (see globals.css and Header.module.scss).
export const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

// Admin-selectable alternatives (src/lib/siteFonts.ts) — each replaces both
// --font-display and --font-body when chosen, so one font runs the whole site.
export const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-open-sans",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-work-sans",
});

export const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

export const FONT_VARIABLE_CLASSES = [
  schibstedGrotesk.variable,
  hankenGrotesk.variable,
  openSans.variable,
  inter.variable,
  poppins.variable,
  workSans.variable,
  manrope.variable,
].join(" ");

// Non-default SiteFontKey -> the CSS variable holding its next/font-generated
// font-family. RootLayout points --font-display/--font-body at this variable
// so a single admin choice swaps both headings and body text at once.
export const SITE_FONT_CSS_VAR: Partial<Record<SiteFontKey, string>> = {
  "open-sans": "--font-open-sans",
  inter: "--font-inter",
  poppins: "--font-poppins",
  "work-sans": "--font-work-sans",
  manrope: "--font-manrope",
};
