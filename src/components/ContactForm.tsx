"use client";

import { useState, FormEvent } from "react";

type UnitContext = { label: string; url: string };

type Props = {
  unitContext?: UnitContext;
  title?: string;
  description?: string;
};

export default function ContactForm({ unitContext, title, description }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(unitContext ? `Quisiera recibir más información sobre ${unitContext.label}.` : "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/public/contact/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        message,
        unitLabel: unitContext?.label,
        unitUrl: unitContext?.url,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult({ ok: false, message: data.error ?? "No se pudo enviar el mensaje." });
      return;
    }
    setResult({ ok: true, message: "¡Gracias! Recibimos tu mensaje y te vamos a contactar a la brevedad." });
    setFullName("");
    setEmail("");
    setPhone("");
    setMessage(unitContext ? `Quisiera recibir más información sobre ${unitContext.label}.` : "");
  }

  if (result?.ok) {
    return (
      <div style={successBox}>
        <p style={successText}>{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={form}>
      {title && <h3 style={formTitle}>{title}</h3>}
      {description && <p style={formDesc}>{description}</p>}

      <div style={row} className="contact-form-row">
        <Field label="Nombre completo">
          <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="Email">
          <input type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
      </div>
      <Field label="Teléfono (opcional)">
        <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </Field>
      <Field label="Mensaje">
        <textarea style={textarea} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </Field>

      {result && !result.ok && <p style={errorStyle}>{result.message}</p>}

      <button type="submit" style={btnPrimary} disabled={loading}>
        {loading ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={fieldWrap}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const formTitle: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "var(--c-ink, #111)" };
const formDesc: React.CSSProperties = { fontSize: "0.85rem", color: "#6b7280", margin: "-0.5rem 0 0", lineHeight: 1.5 };
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" };
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem" };
const fieldLabel: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#374151" };
const input: React.CSSProperties = {
  padding: "0.65rem 0.8rem", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: "0.9rem", width: "100%", outline: "none", background: "#fff",
};
const textarea: React.CSSProperties = { ...input, resize: "vertical", fontFamily: "inherit" };
const errorStyle: React.CSSProperties = { fontSize: "0.82rem", color: "#dc2626", margin: 0 };
const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 1.5rem", background: "#111", color: "#fff",
  borderRadius: 10, fontWeight: 700, fontSize: "0.92rem", border: "none", cursor: "pointer",
};
const successBox: React.CSSProperties = {
  padding: "1.5rem", background: "#f0fdf4", border: "1px solid #86efac",
  borderRadius: 12, textAlign: "center",
};
const successText: React.CSSProperties = { color: "#166534", fontWeight: 600, margin: 0, fontSize: "0.92rem" };
