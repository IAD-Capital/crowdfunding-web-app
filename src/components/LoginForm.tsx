"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Dictionary } from "@/i18n";
import type { AuthBackgroundImage } from "@/lib/authBackgroundImages";
import PasswordInput from "./PasswordInput";
import AuthBackgroundSlideshow from "./AuthBackgroundSlideshow";
import GoogleSignInButton from "./GoogleSignInButton";
import { trackCtaClick } from "@/lib/analytics";
import { authMobileStyle, AUTH_BRAND_GRADIENT } from "./authFormMobileStyle";

type Props = {
  t: Dictionary["auth"]["login"];
  tGoogle: Dictionary["auth"]["google"];
  lang: string;
  next?: string;
  backgroundImages?: AuthBackgroundImage[];
};

export default function LoginForm({ t, tGoogle, lang, next, backgroundImages = [] }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? t.error.generic);
      return;
    }

    trackCtaClick("login_form_submit", { location: "login_page" });

    setRedirecting(true);
    const dest =
      next && next.startsWith("/")
        ? next
        : data.role === "superadmin" ? `/${lang}/admin` : `/${lang}`;
    // A full document navigation (not router.push) so the request carries the
    // just-set auth cookie — a client-side soft nav can render before it lands.
    window.location.href = dest;
  }

  return (
    <div style={splitWrap} className="login-wrap">
      <style dangerouslySetInnerHTML={{ __html: authMobileStyle("login") }} />

      {/* Left — form */}
      <div style={leftPane} className="login-left">
        <div style={leftCard} className="login-form-card">
          <div style={leftInner}>
            <h1 style={title}>{t.title}</h1>

            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <>
                <GoogleSignInButton
                  lang={lang}
                  next={next}
                  locale={lang as "es" | "en"}
                  errorText={tGoogle.error}
                  redirectingText={tGoogle.redirecting}
                />
                <div style={dividerRow}>
                  <span style={dividerLine} />
                  <span style={dividerText}>{tGoogle.divider}</span>
                  <span style={dividerLine} />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} style={form}>
              <label style={label}>{t.email}</label>
              <input
                style={input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div style={passwordLabelRow}>
                <label style={{ ...label, marginTop: 0 }}>{t.password}</label>
                <Link href={`/${lang}/forgot-password`} style={forgotLink}>{t.forgotPassword}</Link>
              </div>
              <PasswordInput
                style={input}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <p style={errorStyle}>{error}</p>}

              <button style={btn} type="submit" disabled={loading || redirecting}>
                {redirecting ? t.redirecting : loading ? t.loading : t.submit}
              </button>
            </form>

            <p style={footer}>
              {t.noAccount}{" "}
              <Link
                href={`/${lang}/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}
                style={link}
                onClick={() => trackCtaClick("login_page_create_account", { location: "login_page" })}
              >
                {t.createOne}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right — brand / background */}
      <div style={rightPane} className="login-right">
        <AuthBackgroundSlideshow images={backgroundImages} />
        <div style={rightPhotoTint} />
        <div style={rightSkylineBack} />
        <div style={rightSkylineFront} />
        <div style={rightGlow} />

        <div style={rightContent} className="login-right-content">
          <Link href={`/${lang}`} style={{ display: "inline-block" }}>
            <Image
              src="/iad-capital-logo.svg"
              alt="IAD Capital"
              width={415}
              height={297}
              style={rightLogo}
              className="login-right-logo"
              priority
            />
          </Link>
          <h2 style={rightHeadline}>Disfrutá del nuevo crowdfunding inmobiliario</h2>
        </div>
      </div>
    </div>
  );
}

const brandGradient = AUTH_BRAND_GRADIENT;

const splitWrap: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  background: "#fff",
  overflow: "hidden",
};

/* Left pane */
const leftPane: React.CSSProperties = {
  flex: "0 0 44%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  overflowY: "auto",
};
const leftCard: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
};
const leftInner: React.CSSProperties = { width: "100%", maxWidth: 380 };
const title: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--c-ink, #0e1726)" };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const label: React.CSSProperties = { fontSize: "0.875rem", fontWeight: 500, marginTop: "0.75rem", color: "var(--c-ink, #0e1726)" };
const input: React.CSSProperties = {
  padding: "0.7rem 0.85rem",
  border: "1px solid var(--c-border-input, #d1d5db)",
  borderRadius: 8,
  fontSize: "1rem",
  outline: "none",
  width: "100%",
  background: "var(--c-field-bg, #f6f8fc)",
};
const passwordLabelRow: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "0.75rem" };
const forgotLink: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--c-accent, #1b4de0)", fontWeight: 500 };
const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.875rem", marginTop: "0.25rem" };
const btn: React.CSSProperties = {
  marginTop: "1.25rem",
  padding: "0.8rem",
  background: "var(--c-accent, #1b4de0)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
};
const footer: React.CSSProperties = { marginTop: "1.5rem", fontSize: "0.875rem", textAlign: "center", color: "var(--c-text-secondary, #6b7280)" };
const link: React.CSSProperties = { color: "var(--c-accent, #1b4de0)", fontWeight: 600 };
const dividerRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" };
const dividerLine: React.CSSProperties = { flex: 1, height: 1, background: "var(--c-border-input, #d1d5db)" };
const dividerText: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--c-text-secondary, #6b7280)", textTransform: "uppercase" };

/* Right pane */
const rightPane: React.CSSProperties = {
  flex: "1 1 56%",
  position: "relative",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: brandGradient,
};
const rightPhotoTint: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(155deg, rgba(31,68,88,0.62) 0%, rgba(31,68,88,0.74) 100%)",
};
const rightGlow: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at 12% 15%, rgba(255,255,255,0.14) 0%, transparent 42%)," +
    "radial-gradient(circle at 88% 82%, rgba(70,211,154,0.22) 0%, transparent 48%)",
};
const rightSkylineBack: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: "38%",
  background: "rgba(0,0,0,0.16)",
  clipPath:
    "polygon(0% 100%, 0% 62%, 5% 62%, 5% 78%, 11% 78%, 11% 45%, 17% 45%, 17% 68%, 23% 68%, 23% 30%, 29% 30%, 29% 58%, 35% 58%, 35% 40%, 41% 40%, 41% 72%, 47% 72%, 47% 22%, 53% 22%, 53% 55%, 59% 55%, 59% 38%, 65% 38%, 65% 64%, 71% 64%, 71% 28%, 77% 28%, 77% 60%, 83% 60%, 83% 42%, 89% 42%, 89% 70%, 95% 70%, 95% 50%, 100% 50%, 100% 100%)",
};
const rightSkylineFront: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: "26%",
  background: "rgba(14,23,38,0.55)",
  clipPath:
    "polygon(0% 100%, 0% 55%, 7% 55%, 7% 72%, 14% 72%, 14% 35%, 21% 35%, 21% 60%, 28% 60%, 28% 20%, 35% 20%, 35% 50%, 42% 50%, 42% 32%, 49% 32%, 49% 66%, 56% 66%, 56% 40%, 63% 40%, 63% 58%, 70% 58%, 70% 24%, 77% 24%, 77% 48%, 84% 48%, 84% 62%, 91% 62%, 91% 30%, 100% 30%, 100% 100%)",
};
const rightContent: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  padding: "2rem 2.25rem",
  maxWidth: 560,
  textAlign: "left",
};
const rightLogo: React.CSSProperties = {
  height: 132,
  width: "auto",
  marginBottom: "2.25rem",
  filter: "brightness(0) invert(1) drop-shadow(0px 2px 2px rgba(0,0,0,0.25))",
};
const rightHeadline: React.CSSProperties = {
  fontFamily: "var(--font-display), system-ui, sans-serif",
  fontSize: "clamp(2.2rem, 3vw + 1.2rem, 3.4rem)",
  lineHeight: 1.12,
  fontWeight: 800,
  color: "#fff",
  margin: 0,
  letterSpacing: "-0.01em",
  textShadow: "0px 2px 2px rgba(0,0,0,0.25)",
};
