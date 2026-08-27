"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackCtaClick } from "@/lib/analytics";

type Props = ComponentProps<typeof Link> & {
  ctaId: string;
  ctaLabel?: string;
  ctaLocation?: string;
};

// Drop-in replacement for next/link that also fires a cta_click GA/GTM event.
// Needed for CTAs rendered from Server Component pages, which can't pass onClick to <Link> directly.
export default function TrackedLink({ ctaId, ctaLabel, ctaLocation, onClick, ...linkProps }: Props) {
  return (
    <Link
      {...linkProps}
      onClick={(e) => {
        trackCtaClick(ctaId, { label: ctaLabel, location: ctaLocation });
        onClick?.(e);
      }}
    />
  );
}
