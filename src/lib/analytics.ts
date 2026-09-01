"use client";

// Fires a GA4/GTM click event for a CTA. Safe to call from anywhere client-side —
// no-ops if GA/GTM haven't loaded yet (e.g. NEXT_PUBLIC_GA_ID/GTM_ID unset in dev).
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackCtaClick(
  id: string,
  extra?: { label?: string; location?: string; [key: string]: unknown }
) {
  if (typeof window === "undefined") return;

  const payload = { cta_id: id, ...extra };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "cta_click", ...payload });
  window.gtag?.("event", "cta_click", payload);
}
