"use client";

import { useState, FormEvent } from "react";

type Props = {
  initialEnabled: boolean;
  initialExpiresAt: string | null; // ISO string
};

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ComingSoonSettingsForm({ initialEnabled, initialExpiresAt }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [expiresAt, setExpiresAt] = useState(toLocalInputValue(initialExpiresAt));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const expiresDate = expiresAt ? new Date(expiresAt) : null;
  const isActive = enabled && !!expiresDate && expiresDate > now;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (enabled && !expiresAt) {
      setError("Definí una fecha de vencimiento para poder habilitar el aviso.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/settings/coming-soon", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coming_soon_enabled: enabled,
        coming_soon_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al guardar.");
      return;
    }
    setSuccess(true);
  }

  return (
    <div style={wrap}>
      <h2 style={title}>Aviso "Próximamente"</h2>
      <p style={hint}>
        Mientras esté habilitado y no haya vencido, todo el sitio público muestra una pantalla de
        "próximamente" en vez del contenido real — útil para que nadie vea el sitio en proceso por error.
      </p>

      <form onSubmit={handleSubmit} style={form}>
        <label style={toggleRow}>
          <div style={toggle(enabled)} onClick={() => setEnabled(!enabled)}>
            <div style={toggleThumb(enabled)} />
          </div>
          <span>
            <strong>{enabled ? "Habilitado" : "Deshabilitado"}</strong>
            <span style={{ color: "#9ca3af", marginLeft: "0.5rem", fontSize: "0.82rem" }}>
              {enabled ? "El aviso puede mostrarse (según la fecha)" : "El sitio público se muestra normalmente"}
            </span>
          </span>
        </label>

        <Field label="Vence el">
          <input
            style={input}
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </Field>

        <div style={{ ...statusPill, ...(isActive ? statusPillActive : statusPillInactive) }}>
          {isActive ? "Aviso activo ahora mismo" : "Aviso no visible ahora mismo"}
        </div>

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>Guardado correctamente.</p>}

        <div style={actions}>
          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
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
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none",
};
const toggleRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", userSelect: "none" };
const toggle = (on: boolean): React.CSSProperties => ({
  width: 44, height: 24, borderRadius: 999, background: on ? "#111" : "#d1d5db",
  position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
});
const toggleThumb = (on: boolean): React.CSSProperties => ({
  position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18,
  borderRadius: "50%", background: "#fff", transition: "left 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
});
const statusPill: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, borderRadius: 8, padding: "0.5rem 0.75rem", width: "fit-content" };
const statusPillActive: React.CSSProperties = { background: "#fef9c3", color: "#854d0e" };
const statusPillInactive: React.CSSProperties = { background: "#f3f4f6", color: "#6b7280" };
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626" };
const successStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#166534" };
const actions: React.CSSProperties = { display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" };
const btnPrimary: React.CSSProperties = {
  padding: "0.55rem 1.25rem", background: "#111", color: "#fff",
  borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", border: "none", cursor: "pointer",
};
