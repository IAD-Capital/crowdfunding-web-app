"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";

export default function AuthCTASection({ lang }: { lang: string }) {
  const router = useRouter();
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

    const dest = data.role === "superadmin" ? `/${lang}/admin` : `/${lang}`;
    router.push(dest);
    router.refresh();
  }

  return (
    <section style={section} id="invertir">
      <div style={inner}>
        {/* Left — copy */}
        <div style={copy}>
          <span style={eyebrow}>Empezá hoy</span>
          <h2 style={headline}>Invertí en bienes raíces desde cualquier monto</h2>
          <p style={sub}>
            Accedé a emprendimientos premium y comprá desde el <strong>5%</strong> de
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
        <div style={formCard}>
          {/* Mode toggle */}
          <div style={toggle}>
            <button style={toggleBtn(mode === "login")} onClick={() => switchMode("login")} type="button">
              Iniciar sesión
            </button>
            <button style={toggleBtn(mode === "signup")} onClick={() => switchMode("signup")} type="button">
              Crear cuenta
            </button>
          </div>

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
              <input
                style={input}
                type="password"
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
  background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
  padding: "6rem 1.5rem",
  color: "#fff",
};
const inner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 420px",
  gap: "5rem",
  alignItems: "center",
};
const copy: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.25rem" };
const eyebrow: React.CSSProperties = {
  fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em",
  textTransform: "uppercase", color: "#4ade80",
};
const headline: React.CSSProperties = {
  fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 900,
  lineHeight: 1.1, letterSpacing: "-0.04em", margin: 0,
};
const sub: React.CSSProperties = { color: "#9ca3af", lineHeight: 1.7, fontSize: "1rem", margin: 0 };
const perks: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" };
const perk: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.92rem", color: "#d1d5db" };
const checkmark: React.CSSProperties = { color: "#4ade80", fontWeight: 900, flexShrink: 0, marginTop: "0.05rem" };

const formCard: React.CSSProperties = {
  background: "#fff", borderRadius: 20, padding: "2rem",
  boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
  display: "flex", flexDirection: "column", gap: "1.25rem",
};
const toggle: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr",
  background: "#f3f4f6", borderRadius: 10, padding: "0.2rem", gap: "0.2rem",
};
const toggleBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.5rem", border: "none", borderRadius: 8,
  background: active ? "#fff" : "transparent",
  color: active ? "#111" : "#6b7280",
  fontWeight: active ? 700 : 500, fontSize: "0.875rem",
  cursor: "pointer", transition: "all 0.15s",
  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
});
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const label: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#374151" };
const input: React.CSSProperties = {
  padding: "0.65rem 0.875rem", border: "1.5px solid #e5e7eb", borderRadius: 9,
  fontSize: "0.95rem", color: "#111", outline: "none",
  transition: "border-color 0.15s",
};
const errorMsg: React.CSSProperties = {
  background: "#fee2e2", color: "#991b1b", borderRadius: 8,
  padding: "0.5rem 0.75rem", fontSize: "0.82rem", margin: 0,
};
const submit: React.CSSProperties = {
  padding: "0.8rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 10, fontSize: "0.95rem",
  fontWeight: 700, cursor: "pointer", marginTop: "0.25rem",
  transition: "opacity 0.15s",
};
const switchHint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", textAlign: "center", margin: 0 };
const switchLink: React.CSSProperties = {
  background: "none", border: "none", color: "#111",
  fontWeight: 700, cursor: "pointer", fontSize: "0.82rem", padding: 0,
};
