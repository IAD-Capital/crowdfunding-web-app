"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SendResult = { sent: number; failed: number; total: number };

export default function PushNotificationForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/admin/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, url: url || undefined }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al enviar la notificación.");
      return;
    }

    setResult(data);
    setTitle("");
    setBody("");
    setUrl("");
    router.refresh();
  }

  return (
    <div style={wrap}>
      <h2 style={heading}>Enviar notificación</h2>
      <p style={hint}>Se enviará como push a todos los dispositivos suscriptos.</p>

      <form onSubmit={handleSubmit} style={form}>
        <label style={label}>
          Título
          <input
            style={input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </label>
        <label style={label}>
          Mensaje
          <textarea
            style={{ ...input, resize: "vertical", minHeight: 80 }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            required
          />
        </label>
        <label style={label}>
          Link (opcional)
          <input
            style={input}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/es/developments/12"
          />
        </label>

        <button type="submit" style={submitBtn} disabled={loading}>
          {loading ? "Enviando…" : "Enviar notificación"}
        </button>

        {error && <p style={errorStyle}>{error}</p>}
        {result && (
          <p style={successStyle}>
            Enviado a {result.sent} de {result.total} dispositivos
            {result.failed > 0 ? ` (${result.failed} fallaron)` : ""}.
          </p>
        )}
      </form>
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb", maxWidth: 480 };
const heading: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" };
const hint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const label: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.82rem", fontWeight: 600, color: "#374151" };
const input: React.CSSProperties = {
  padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: "0.88rem", fontFamily: "inherit", color: "#111",
};
const submitBtn: React.CSSProperties = {
  background: "#1b4de0", color: "#fff", border: "none", borderRadius: 8,
  padding: "0.65rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer",
};
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626", margin: 0 };
const successStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#166534", margin: 0 };
