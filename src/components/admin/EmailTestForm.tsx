"use client";

import { useState, FormEvent } from "react";

export type EmailTestUser = { id: number; full_name: string; email: string };

type Props = { users: EmailTestUser[]; senderEmail: string };

export default function EmailTestForm({ users, senderEmail }: Props) {
  const [to, setTo] = useState(users[0]?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!to) {
      setResult({ ok: false, message: "Seleccioná un destinatario." });
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/settings/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult({ ok: false, message: data.error ?? "No se pudo enviar el email." });
      return;
    }
    setResult({ ok: true, message: `Email enviado a ${data.to}.` });
  }

  return (
    <div style={wrap}>
      <h2 style={title}>Prueba de envío de emails</h2>
      <p style={hint}>
        Envía un email de prueba para validar que el envío esté funcionando. Se envía desde{" "}
        <strong>{senderEmail}</strong> a la dirección del usuario registrado que elijas.
      </p>

      {users.length === 0 ? (
        <p style={hint}>No hay usuarios registrados todavía.</p>
      ) : (
        <form onSubmit={handleSubmit} style={form}>
          <Field label="Destinatario">
            <select style={select} value={to} onChange={(e) => setTo(e.target.value)}>
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.full_name} — {u.email}
                </option>
              ))}
            </select>
          </Field>

          {result && (
            <p style={result.ok ? successStyle : errorStyle}>{result.message}</p>
          )}

          <div style={actions}>
            <button type="submit" style={btnPrimary} disabled={loading}>
              {loading ? "Enviando…" : "Enviar prueba"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb", maxWidth: 480 };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" };
const hint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const select: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none", background: "#fff",
};
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626" };
const successStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#166534" };
const actions: React.CSSProperties = { display: "flex", justifyContent: "flex-end" };
const btnPrimary: React.CSSProperties = {
  padding: "0.55rem 1.25rem", background: "#111", color: "#fff",
  borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", border: "none", cursor: "pointer",
};
