"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Dictionary } from "@/i18n";

type Props = {
  t: Dictionary["auth"]["signup"];
  lang: string;
};

const PASSWORD_CHECKS = (t: Props["t"]) => [
  { label: t.checks.length,    test: (p: string) => p.length >= 8 },
  { label: t.checks.uppercase, test: (p: string) => /[A-Z]/.test(p) },
  { label: t.checks.lowercase, test: (p: string) => /[a-z]/.test(p) },
  { label: t.checks.number,    test: (p: string) => /\d/.test(p) },
  { label: t.checks.special,   test: (p: string) => /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function SignupForm({ t, lang }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChecks, setShowChecks] = useState(false);

  const checks = PASSWORD_CHECKS(t);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const failing = checks.find((c) => !c.test(password));
    if (failing) {
      setError(t.error.passwordRules);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? t.error.generic);
      return;
    }

    router.push(`/${lang}`);
    router.refresh();
  }

  return (
    <div style={card}>
      <h1 style={title}>{t.title}</h1>

      <form onSubmit={handleSubmit} style={form}>
        <label style={label}>{t.fullName}</label>
        <input style={input} type="text" autoComplete="name"
          value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label style={label}>{t.email}</label>
        <input style={input} type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label style={label}>{t.password}</label>
        <input style={input} type="password" autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setShowChecks(true)}
          required />

        {showChecks && (
          <ul style={checkList}>
            {checks.map((c) => {
              const ok = c.test(password);
              return (
                <li key={c.label} style={{ color: ok ? "#16a34a" : "#6b7280" }}>
                  {ok ? "✓" : "○"} {c.label}
                </li>
              );
            })}
          </ul>
        )}

        {error && <p style={errorStyle}>{error}</p>}

        <button style={btn} type="submit" disabled={loading}>
          {loading ? t.loading : t.submit}
        </button>
      </form>

      <p style={footer}>
        {t.haveAccount}{" "}
        <Link href={`/${lang}/login`} style={link}>{t.signIn}</Link>
      </p>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, padding: "2.5rem 2rem",
  width: "100%", maxWidth: 420, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
};
const title: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.75rem" };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const label: React.CSSProperties = { fontSize: "0.875rem", fontWeight: 500, marginTop: "0.75rem" };
const input: React.CSSProperties = {
  padding: "0.625rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "1rem", outline: "none", width: "100%",
};
const checkList: React.CSSProperties = {
  listStyle: "none", fontSize: "0.8rem",
  display: "flex", flexDirection: "column", gap: "0.2rem", marginTop: "0.25rem",
};
const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.875rem", marginTop: "0.25rem" };
const btn: React.CSSProperties = {
  marginTop: "1.25rem", padding: "0.75rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontSize: "1rem", fontWeight: 600, cursor: "pointer",
};
const footer: React.CSSProperties = { marginTop: "1.25rem", fontSize: "0.875rem", textAlign: "center", color: "#6b7280" };
const link: React.CSSProperties = { color: "#111", fontWeight: 600 };
