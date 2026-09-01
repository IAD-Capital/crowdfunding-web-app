"use client";

import { useState, FormEvent } from "react";
import PasswordInput from "./PasswordInput";
import GoogleSignInButton from "./GoogleSignInButton";
import { trackCtaClick } from "@/lib/analytics";

type Mode = "login" | "signup";

export default function AuthCTASection({ lang }: { lang: string }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setEmail(""); setPassword(""); setFullName(""); setError("");
  }

  function switchMode(m: Mode) {
    setMode(m);
    reset();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "login"
      ? { email, password }
      : { fullName, email, password };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Ocurrió un error. Intentá de nuevo.");
      return;
    }

    trackCtaClick(mode === "login" ? "auth_cta_login_submit" : "auth_cta_signup_submit", { location: "home_auth_cta" });

    const dest = data.role === "superadmin" ? `/${lang}/admin` : `/${lang}`;
    // A full document navigation (not router.push) so the request carries the
    // just-set auth cookie — a client-side soft nav can render before it lands.
    window.location.href = dest;
  }

  return (
    <section style={section} id="invertir">
      <style>{`
        @media (max-width: 760px) {
          .auth-cta-inner { grid-template-columns: 1fr !important; padding: 1.5rem !important; gap: 1.75rem !important; }
          .auth-cta-form-card { padding: 1.5rem !important; }
        }
      `}</style>
      <div style={inner} className="auth-cta-inner">
        {/* Left — copy */}
        <div style={copy}>
          <span style={eyebrow}>Empezá hoy</span>
          <h2 style={headline}>Invertí en bienes raíces desde cualquier monto</h2>
          <p style={sub}>
            Accedé a departamentos premium y comprá desde el <strong>5%</strong> de
            una unidad funcional. Creá tu cuenta en minutos o ingresá con tu usuario.
          </p>
          <ul style={perks}>
            {[
              "Sin mínimo de capital elevado",
              "Transparencia total en cada inversión",
              "Seguimiento en tiempo real de tu cartera",
              "Retiro de inversión con aprobación",
            ].map((p) => (
              <li key={p} style={perk}>
                <span style={checkmark}>✓</span> {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div style={formCard} className="auth-cta-form-card">
          {/* Mode toggle */}
          <div style={toggle}>
            <button style={toggleBtn(mode === "login")} onClick={() => switchMode("login")} type="button">
              Iniciar sesión
            </button>
            <button style={toggleBtn(mode === "signup")} onClick={() => switchMode("signup")} type="button">
              Crear cuenta
            </button>
          </div>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <>
              <GoogleSignInButton
                lang={lang}
                locale={lang as "es" | "en"}
                errorText="No pudimos iniciar sesión con Google. Intenta nuevamente."
                redirectingText="Redirigiendo…"
                theme="filled_black"
              />
              <div style={dividerRow}>
                <span style={dividerLine} />
                <span style={dividerText}>o</span>
                <span style={dividerLine} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} style={form}>
            {mode === "signup" && (
              <div style={field}>
                <label style={label}>Nombre completo</label>
                <input
                  style={input}
                  type="text"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div style={field}>
              <label style={label}>Email</label>
              <input
                style={input}
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div style={field}>
              <label style={label}>Contraseña</label>
              <PasswordInput
                style={input}
                placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && <p style={errorMsg}>{error}</p>}

            <button style={submit} type="submit" disabled={loading}>
              {loading
                ? "Procesando…"
                : mode === "login"
                ? "Ingresar y ver catálogo"
                : "Crear cuenta e invertir"}
            </button>
          </form>

          <p style={switchHint}>
            {mode === "login" ? "¿No tenés cuenta?" : "¿Ya tenés cuenta?"}{" "}
            <button
              style={switchLink}
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              type="button"
            >
              {mode === "login" ? "Registrate gratis" : "Iniciá sesión"}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

/* Styles */
const section: React.CSSProperties = {
  background: "var(--c-bg)",
  padding: "4rem 1.5rem 5rem",
  color: "#fff",
};
const inner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-dark))",
  borderRadius: 26,
  padding: "3.5rem",
  display: "grid",
  gridTemplateColumns: "1.1fr .9fr",
  gap: "3.5rem",
  alignItems: "center",
  boxShadow: "0 40px 80px -40px rgba(27,77,224,0.6)",
};
const copy: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.1rem" };
const eyebrow: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "#bcd0ff",
};
const headline: React.CSSProperties = {
  fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)", fontWeight: 800,
  lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0,
};
const sub: React.CSSProperties = { color: "#d6e0ff", lineHeight: 1.6, fontSize: "1rem", margin: 0, maxWidth: 440 };
const perks: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" };
const perk: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.92rem", color: "#fff" };
const checkmark: React.CSSProperties = {
  width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.18)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "#fff", fontWeight: 800, fontSize: "0.7rem", flexShrink: 0,
};

const formCard: React.CSSProperties = {
  background: "var(--c-surface)", borderRadius: 18, padding: "2rem",
  display: "flex", flexDirection: "column", gap: "1.25rem",
};
const toggle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr",
  background: "var(--c-field-bg)", borderRadius: 10, padding: "0.2rem", gap: "0.2rem",
};
const toggleBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.5rem", border: "none", borderRadius: 8,
  background: active ? "#fff" : "transparent",
  color: active ? "var(--c-ink)" : "var(--c-text-secondary)",
  fontWeight: active ? 700 : 500, fontSize: "0.875rem",
  cursor: "pointer", transition: "all 0.15s",
  boxShadow: active ? "0 1px 4px rgba(14,23,38,0.08)" : "none",
});
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const label: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 700, color: "var(--c-text-secondary)" };
const input: React.CSSProperties = {
  padding: "0.7rem 0.9rem", border: "1px solid var(--c-border-input)", borderRadius: 11,
  fontSize: "0.95rem", color: "var(--c-ink)", outline: "none", background: "var(--c-field-bg)",
  transition: "border-color 0.15s",
};
const errorMsg: React.CSSProperties = {
  background: "#fee2e2", color: "#991b1b", borderRadius: 8,
  padding: "0.5rem 0.75rem", fontSize: "0.82rem", margin: 0,
};
const submit: React.CSSProperties = {
  padding: "0.85rem", background: "var(--c-accent)", color: "#fff",
  border: "none", borderRadius: 11, fontSize: "0.95rem",
  fontWeight: 600, cursor: "pointer", marginTop: "0.25rem",
  transition: "opacity 0.15s", boxShadow: "0 10px 22px rgba(27,77,224,0.22)",
};
const dividerRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem" };
const dividerLine: React.CSSProperties = { flex: 1, height: 1, background: "var(--c-border-input)" };
const dividerText: React.CSSProperties = { fontSize: "0.8125rem", color: "var(--c-text-secondary)", textTransform: "uppercase" };
const switchHint: React.CSSProperties = { fontSize: "0.85rem", color: "var(--c-text-secondary)", textAlign: "center", margin: 0 };
const switchLink: React.CSSProperties = {
  background: "none", border: "none", color: "var(--c-accent)",
  fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", padding: 0,
};
