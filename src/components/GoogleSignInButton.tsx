"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, string>) => void;
        };
      };
    };
  }
}

type Props = {
  lang: string;
  next?: string;
  locale: "es" | "en";
  errorText: string;
  redirectingText: string;
  theme?: "outline" | "filled_black" | "filled_blue";
};

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export default function GoogleSignInButton({ lang, next, locale, errorText, redirectingText, theme = "outline" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    let cancelled = false;

    async function handleCredential(response: { credential: string }) {
      setError("");
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? errorText);
        return;
      }

      setRedirecting(true);
      const dest =
        next && next.startsWith("/")
          ? next
          : data.role === "superadmin" ? `/${lang}/admin` : `/${lang}`;
      // A full document navigation (not router.push) so the request carries the
      // just-set auth cookie — a client-side soft nav can render before it lands.
      window.location.href = dest;
    }

    function render() {
      if (cancelled || !window.google || !buttonRef.current) return;
      // Google's button has no responsive/percentage width — it must be given
      // a fixed pixel value, so measure the actual available space (the wrap
      // is width:100%, unlike the shrink-to-fit button div) instead of
      // hardcoding one, otherwise narrow containers get a clipped/overflowing
      // button.
      const available = wrapRef.current?.offsetWidth || 380;
      const width = Math.max(200, Math.min(380, available));
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme,
        size: "large",
        width: String(width),
        text: "continue_with",
        locale,
      });
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google) render();
      else existing.addEventListener("load", render);
    } else {
      const script = document.createElement("script");
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [clientId, lang, next, locale, errorText, theme]);

  if (!clientId) return null;

  return (
    <div ref={wrapRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", width: "100%" }}>
      <div ref={buttonRef} style={redirecting ? { opacity: 0.6, pointerEvents: "none" } : undefined} />
      {redirecting && (
        <p style={{ color: "var(--c-text-secondary, #6b7280)", fontSize: "0.875rem", margin: 0 }}>{redirectingText}</p>
      )}
      {error && <p style={{ color: "#dc2626", fontSize: "0.875rem", margin: 0 }}>{error}</p>}
    </div>
  );
}
