// Curated set of site-wide typography choices offered in the admin panel.
// Kept framework-agnostic (no next/font import) so it can be safely used
// from client components — see src/lib/fonts.ts for the actual font loaders.

export type SiteFontKey = "default" | "open-sans" | "inter" | "poppins" | "work-sans" | "manrope";

export const DEFAULT_SITE_FONT: SiteFontKey = "default";

export const SITE_FONT_OPTIONS: { value: SiteFontKey; label: string }[] = [
  { value: "default", label: "Predeterminada (Schibsted Grotesk + Hanken Grotesk)" },
  { value: "open-sans", label: "Open Sans" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "work-sans", label: "Work Sans" },
  { value: "manrope", label: "Manrope" },
];

export function isSiteFontKey(value: unknown): value is SiteFontKey {
  return typeof value === "string" && SITE_FONT_OPTIONS.some((opt) => opt.value === value);
}
