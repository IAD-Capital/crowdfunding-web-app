"use client";

import type { ComponentProps } from "react";
import { trackCtaClick } from "@/lib/analytics";

type Props = ComponentProps<"a"> & {
  ctaId: string;
  ctaLabel?: string;
  ctaLocation?: string;
};

// Plain <a> wrapper with a cta_click event, for outbound links (social, contact) rendered from Server Component pages.
// UTM params don't help here since the destination isn't ours to attribute — a GA/GTM event is what actually tracks the click.
export default function TrackedAnchor({ ctaId, ctaLabel, ctaLocation, onClick, ...anchorProps }: Props) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackCtaClick(ctaId, { label: ctaLabel, location: ctaLocation });
        onClick?.(e);
      }}
    />
  );
}
