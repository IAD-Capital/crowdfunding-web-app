"use client";

import { trackCtaClick } from "@/lib/analytics";

type Props = {
  label: string;
  style?: React.CSSProperties;
  ctaId: string;
  ctaLabel?: string;
  ctaLocation?: string;
};

// Opens the ChatbotWidget, which is mounted once in PublicShell — a custom
// event is the simplest way to reach it from anywhere without prop drilling.
export default function OpenChatbotButton({ label, style, ctaId, ctaLabel, ctaLocation }: Props) {
  return (
    <button
      type="button"
      style={style}
      onClick={() => {
        trackCtaClick(ctaId, { label: ctaLabel, location: ctaLocation });
        window.dispatchEvent(new Event("iad:open-chatbot"));
      }}
    >
      {label}
    </button>
  );
}
