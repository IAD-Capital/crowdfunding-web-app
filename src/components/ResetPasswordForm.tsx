"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Dictionary } from "@/i18n";
import type { AuthBackgroundImage } from "@/lib/authBackgroundImages";
import PasswordInput from "./PasswordInput";
import AuthBackgroundSlideshow from "./AuthBackgroundSlideshow";

type Props = {
  t: Dictionary["auth"]["resetPassword"];
  lang: string;
  token?: string;
  backgroundImages?: AuthBackgroundImage[];
};

const PASSWORD_CHECKS = (t: Props["t"]) => [
  { label: t.checks.length,    test: (p: string) => p.length >= 8 },
  { label: t.checks.uppercase, test: (p: string) => /[A-Z]/.test(p) },
  { label: t.checks.lowercase, test: (p: string) => /[a-z]/.test(p) },
  { label: t.checks.number,    test: (p: string) => /\d/.test(p) },
  { label: t.checks.special,   test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function ResetPasswordForm({ t, lang, token, backgroundImages = [] }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChecks, setShowChecks] = useState(false);
  const [done, setDone] = useState(false);

  const checks = PASSWORD_CHECKS(t);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const failing = checks.find((c) => !c.test(password));
    if (failing) {
      setError(t.error.passwordRules);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.error.mismatch);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error === "This reset link is invalid or has expired." ? t.error.invalidToken : t.error.generic);
      return;
    }

    setDone(true);
  }

  return (
    <div style={splitWrap} className="reset-wrap">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 900px) {
          .reset-wrap {
            position: relative !important;
            height: auto !important;
            min-height: 100vh !important;
            flex-direction: column-reverse !important;
            overflow: visible !important;
            background: ${brandGradient} !important;
          }
          .reset-right {
            display: flex !important;
            flex: 0 0 auto !important;
            min-height: 200px !important;
            background: transparent !important;
          }
          .reset-right-content {
            padding: 2rem 1.5rem 1.5rem !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
          .reset-right-logo {
            height: 108px !important;
          }
          .reset-left {
            flex: 1 1 auto !important;
            padding: 0 !important;
            align-items: stretch !important;
            justify-content: flex-end !important;
          }
          .reset-form-card {
            background: #fff !important;
            border-radius: 24px 24px 0 0 !important;
            padding: 2rem 1.5rem 2.25rem !important;
            box-shadow: 0 -12px 30px rgba(14,23,38,0.18) !important;
          }
        }
      `,
        }}
      />

      {/* Left — form */}
      <div style={leftPane} className="reset-left">
        <div style={leftCard} className="reset-form-card">
          <div style={leftInner}>
            <h1 style={title}>{t.title}</h1>

            {done ? (
              <>
                <p style={description}>{t.success}</p>
                <button style={btn} type="button" onClick={() => router.push(`/${lang}/login`)}>
                  {t.goToLogin}
                </button>
              </>
            ) : !token ? (
              <p style={errorStyle}>{t.error.invalidToken}</p>
            ) : (
              <form onSubmit={handleSubmit} style={form}>
                <label style={label}>{t.password}</label>
                <PasswordInput
                  style={input}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowChecks(true)}
                  required
                />

                {showChecks && (
                  <ul style={checkList}>
                    {checks.map((c) => {
                      const ok = c.test(password);
                      return (
                        <li key={c.label} style={{ color: ok ? "#16a34a" : "var(--c-text-secondary, #6b7280)" }}>
                          {ok ? "✓" : "○"} {c.label}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <label style={label}>{t.confirmPassword}</label>
                <PasswordInput
                  style={input}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                {error && <p style={errorStyle}>{error}</p>}

                <button style={btn} type="submit" disabled={loading}>
                  {loading ? t.loading : t.submit}
                </button>
              </form>
            )}

            {!done && (
              <p style={footer}>
                <Link href={`/${lang}/login`} style={link}>{t.goToLogin}</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right — brand / background */}
      <div style={rightPane} className="reset-right">
        <AuthBackgroundSlideshow images={backgroundImages} />
        <div style={rightPhotoTint} />
        <div style={rightSkylineBack} />
        <div style={rightSkylineFront} />
        <div style={rightGlow} />

        <div style={rightContent} className="reset-right-content">
          <Link href={`/${lang}`} style={{ display: "inline-block" }}>
            <Image
              src="/iad-capital-logo.svg"
              alt="IAD Capital"
              width={415}
              height={297}
              style={rightLogo}
              className="reset-right-logo"
              priority
            />
          </Link>
          <h2 style={rightHeadline}>Disfrutá del nuevo crowdfunding inmobiliario</h2>
        </div>
      </div>
    </div>
  );
}

const brandGradient = "#1F4458";

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
const title: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--c-ink, #0e1726)" };
const description: React.CSSProperties = { fontSize: "0.9rem", color: "var(--c-text-secondary, #6b7280)", marginBottom: "1rem", lineHeight: 1.5 };
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
const checkList: React.CSSProperties = {
  listStyle: "none", fontSize: "0.8rem", padding: 0,
  display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.35rem",
};
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
  width: "100%",
};
const footer: React.CSSProperties = { marginTop: "1.5rem", fontSize: "0.875rem", textAlign: "center", color: "var(--c-text-secondary, #6b7280)" };
const link: React.CSSProperties = { color: "var(--c-accent, #1b4de0)", fontWeight: 600 };

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
  filter: "brightness(0) invert(1) drop-shadow(0 2px 10px rgba(0,0,0,0.25))",
};
const rightHeadline: React.CSSProperties = {
  fontFamily: "var(--font-display), system-ui, sans-serif",
  fontSize: "clamp(2.2rem, 3vw + 1.2rem, 3.4rem)",
  lineHeight: 1.12,
  fontWeight: 800,
  color: "#fff",
  margin: 0,
  letterSpacing: "-0.01em",
};
