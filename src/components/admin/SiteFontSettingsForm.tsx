"use client";

import { useState } from "react";
import { SITE_FONT_OPTIONS, type SiteFontKey } from "@/lib/siteFonts";

type Props = { initialFont: SiteFontKey };

export default function SiteFontSettingsForm({ initialFont }: Props) {
  const [font, setFont] = useState<SiteFontKey>(initialFont);
  const [saved, setSaved] = useState<SiteFontKey>(initialFont);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/admin/settings/site-font", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_font: font }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al guardar.");
      return;
    }
    setSaved(font);
    setSuccess(true);
  }

  const dirty = font !== saved;

  return (
    <div style={wrap}>
      <h2 style={title}>Tipografía</h2>
      <p style={hint}>
        Elegí la fuente que usa el sitio público, tanto en títulos como en texto general.
        El cambio se aplica a todos los visitantes al guardar (puede tardar un momento en
        reflejarse por el caché de la página).
      </p>

      <select
        value={font}
        onChange={(e) => { setFont(e.target.value as SiteFontKey); setSuccess(false); }}
        style={selectStyle}
      >
        {SITE_FONT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <button type="button" onClick={save} disabled={loading || !dirty} style={saveBtn(loading || !dirty)}>
        {loading ? "Guardando…" : "Guardar"}
      </button>

      {error && <p style={errorStyle}>{error}</p>}
      {success && <p style={successStyle}>Guardado correctamente.</p>}
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb", maxWidth: 480 };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" };
const hint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 };
const selectStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "0.55rem 0.7rem", borderRadius: 8,
  border: "1px solid #d1d5db", fontSize: "0.9rem", marginBottom: "1rem", background: "#fff", color: "#111",
};
const saveBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "0.5rem 1.1rem", border: "none", borderRadius: 8, background: "#111", color: "#fff",
  fontSize: "0.875rem", fontWeight: 700, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
});
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626", marginTop: "0.75rem" };
const successStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#166534", marginTop: "0.75rem" };
