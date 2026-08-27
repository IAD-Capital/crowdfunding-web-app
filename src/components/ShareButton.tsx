"use client";

import { useEffect, useRef, useState } from "react";
import { Share, Link as LinkIcon, Check } from "lucide-react";

type Props = {
  url: string;
  title: string;
  variant?: "hero" | "inline";
};

export default function ShareButton({ url, title, variant = "inline" }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (older browser / no permission) — WhatsApp share still works.
    }
  }

  // Copy Link keeps the clean canonical URL; WhatsApp gets UTM tags so that channel is attributable in analytics.
  const whatsappUrl = new URL(url);
  whatsappUrl.searchParams.set("utm_source", "whatsapp");
  whatsappUrl.searchParams.set("utm_medium", "social");
  whatsappUrl.searchParams.set("utm_campaign", "share_property");
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${title} ${whatsappUrl.toString()}`)}`;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={variant === "hero" ? heroTriggerBtn : inlineTriggerBtn}
        aria-label="Compartir"
        aria-expanded={open}
      >
        <Share size={variant === "hero" ? 18 : 16} />
        {variant === "inline" && <span>Compartir</span>}
      </button>

      {open && (
        <div style={{ ...menu, ...(variant === "hero" ? menuHero : menuInline) }}>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            style={menuItem}
            onClick={() => setOpen(false)}
          >
            <span style={{ ...menuIconWrap, background: "#25D366" }}>
              <WhatsAppIcon />
            </span>
            WhatsApp
          </a>
          <button type="button" style={{ ...menuItem, ...menuItemBtn }} onClick={handleCopy}>
            <span style={{ ...menuIconWrap, background: "#f3f4f6", color: "#374151" }}>
              {copied ? <Check size={16} /> : <LinkIcon size={16} />}
            </span>
            {copied ? "¡Copiado!" : "Copiar enlace"}
          </button>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.29-1.39a9.87 9.87 0 0 0 4.75 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.13.11-1.82-.12-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.15-.2-1.18-1.57-1.18-3 0-1.42.75-2.13 1.01-2.42.27-.29.58-.36.78-.36l.56.01c.18 0 .42-.07.66.5.24.58.83 2 .9 2.14.07.15.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.57.15.28.68 1.13 1.47 1.83 1.01.9 1.87 1.19 2.15 1.32.28.14.44.12.6-.07.17-.2.71-.83.9-1.11.19-.28.38-.24.63-.14.26.09 1.66.78 1.94.92.28.14.47.21.54.33.07.12.07.68-.17 1.35z" />
    </svg>
  );
}

const heroTriggerBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: "50%",
  background: "rgba(17,17,17,0.55)", color: "#fff", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", backdropFilter: "blur(2px)",
};

const inlineTriggerBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.4rem",
  padding: "0.4rem 0.75rem", borderRadius: 8, border: "1px solid #d1d5db",
  background: "#fff", color: "#111", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
};

const menu: React.CSSProperties = {
  position: "absolute", zIndex: 20, background: "#fff", borderRadius: 12,
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)", border: "1px solid #e5e7eb",
  padding: "0.4rem", minWidth: 190, display: "flex", flexDirection: "column", gap: "0.15rem",
};
const menuHero: React.CSSProperties = { top: "calc(100% + 8px)", right: 0 };
const menuInline: React.CSSProperties = { top: "calc(100% + 8px)", left: 0 };

const menuItem: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.65rem",
  padding: "0.55rem 0.6rem", borderRadius: 8, textDecoration: "none",
  color: "#111", fontSize: "0.88rem", fontWeight: 600, background: "none",
  border: "none", cursor: "pointer", textAlign: "left", width: "100%",
};
const menuItemBtn: React.CSSProperties = { fontFamily: "inherit" };
const menuIconWrap: React.CSSProperties = {
  width: 28, height: 28, borderRadius: "50%", display: "flex",
  alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff",
};
