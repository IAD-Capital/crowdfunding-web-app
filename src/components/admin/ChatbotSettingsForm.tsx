"use client";

import { useState } from "react";

type Props = { initialEnabled: boolean };

export default function ChatbotSettingsForm({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/admin/settings/chatbot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatbot_enabled: next }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setEnabled(!next);
      setError(data.error ?? "Error al guardar.");
      return;
    }
    setSuccess(true);
  }

  return (
    <div style={wrap}>
      <h2 style={title}>Chatbot</h2>
      <p style={hint}>
        Mientras esté habilitado, el ícono del asistente aparece flotando en el sitio público.
        Deshabilitarlo lo oculta por completo, sin borrar las preguntas cargadas.
      </p>

      <label style={toggleRow}>
        <div style={toggleStyle(enabled)} onClick={toggle}>
          <div style={toggleThumb(enabled)} />
        </div>
        <span>
          <strong>{enabled ? "Habilitado" : "Deshabilitado"}</strong>
          <span style={{ color: "#9ca3af", marginLeft: "0.5rem", fontSize: "0.82rem" }}>
            {loading ? "Guardando…" : enabled ? "Visible en el sitio público" : "Oculto en el sitio público"}
          </span>
        </span>
      </label>

      {error && <p style={errorStyle}>{error}</p>}
      {success && <p style={successStyle}>Guardado correctamente.</p>}
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb", maxWidth: 480 };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" };
const hint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 };
const toggleRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", userSelect: "none" };
const toggleStyle = (on: boolean): React.CSSProperties => ({
  width: 44, height: 24, borderRadius: 999, background: on ? "#111" : "#d1d5db",
  position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
});
const toggleThumb = (on: boolean): React.CSSProperties => ({
  position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18,
  borderRadius: "50%", background: "#fff", transition: "left 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
});
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626", marginTop: "0.75rem" };
const successStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#166534", marginTop: "0.75rem" };
