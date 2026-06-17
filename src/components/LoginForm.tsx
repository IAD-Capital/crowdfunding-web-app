"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Dictionary } from "@/i18n";

type Props = {
  t: Dictionary["auth"]["login"];
  lang: string;
};

export default function LoginForm({ t, lang }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? t.error.generic);
      return;
    }

    const dest = data.role === "superadmin" ? `/${lang}/admin` : `/${lang}`;
    router.push(dest);
    router.refresh();
  }

  return (
    <div style={card}>
      <h1 style={title}>{t.title}</h1>

      <form onSubmit={handleSubmit} style={form}>
        <label style={label}>{t.email}</label>
        <input style={input} type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label style={label}>{t.password}</label>
        <input style={input} type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p style={errorStyle}>{error}</p>}

        <button style={btn} type="submit" disabled={loading}>
          {loading ? t.loading : t.submit}
        </button>
      </form>

      <p style={footer}>
        {t.noAccount}{" "}
        <Link href={`/${lang}/signup`} style={link}>{t.createOne}</Link>
      </p>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, padding: "2.5rem 2rem",
  width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
};
const title: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.75rem" };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const label: React.CSSProperties = { fontSize: "0.875rem", fontWeight: 500, marginTop: "0.75rem" };
const input: React.CSSProperties = {
  padding: "0.625rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "1rem", outline: "none", width: "100%",
};
const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.875rem", marginTop: "0.25rem" };
const btn: React.CSSProperties = {
  marginTop: "1.25rem", padding: "0.75rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontSize: "1rem", fontWeight: 600, cursor: "pointer",
};
const footer: React.CSSProperties = { marginTop: "1.25rem", fontSize: "0.875rem", textAlign: "center", color: "#6b7280" };
const link: React.CSSProperties = { color: "#111", fontWeight: 600 };
