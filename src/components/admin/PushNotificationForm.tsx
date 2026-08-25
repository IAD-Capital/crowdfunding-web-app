"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export type PushTemplate = { id: number; title: string; body: string; url: string | null };

type SendResult = { sent: number; failed: number; total: number };

type Props = { initialTemplates: PushTemplate[] };

export default function PushNotificationForm({ initialTemplates }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SendResult | null>(null);

  const [templates, setTemplates] = useState(initialTemplates);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  async function handleSaveTemplate() {
    setTemplateError("");
    if (!title.trim() || !body.trim()) {
      setTemplateError("Completá título y mensaje antes de guardar la plantilla.");
      return;
    }
    setSavingTemplate(true);
    const res = await fetch("/api/admin/push/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, url: url || undefined }),
    });
    const data = await res.json();
    setSavingTemplate(false);

    if (!res.ok) {
      setTemplateError(data.error ?? "Error al guardar la plantilla.");
      return;
    }
    setTemplates((prev) => [data, ...prev]);
  }

  function handleUseTemplate(t: PushTemplate) {
    setTitle(t.title);
    setBody(t.body);
    setUrl(t.url ?? "");
    setResult(null);
    setError("");
  }

  async function handleDeleteTemplate(id: number) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/push/templates/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
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

        <div style={actionsRow}>
          <button type="submit" style={submitBtn} disabled={loading}>
            {loading ? "Enviando…" : "Enviar notificación"}
          </button>
          <button type="button" style={saveBtn} onClick={handleSaveTemplate} disabled={savingTemplate}>
            {savingTemplate ? "Guardando…" : "Guardar como plantilla"}
          </button>
        </div>

        {templateError && <p style={errorStyle}>{templateError}</p>}
        {error && <p style={errorStyle}>{error}</p>}
        {result && (
          <p style={successStyle}>
            Enviado a {result.sent} de {result.total} dispositivos
            {result.failed > 0 ? ` (${result.failed} fallaron)` : ""}.
          </p>
        )}
      </form>

      {templates.length > 0 && (
        <div style={templatesWrap}>
          <h3 style={templatesTitle}>Plantillas guardadas</h3>
          <ul style={templatesList}>
            {templates.map((t) => (
              <li key={t.id} style={templateItem}>
                <button type="button" style={templateUseBtn} onClick={() => handleUseTemplate(t)}>
                  <span style={templateItemTitle}>{t.title}</span>
                  <span style={templateItemBody}>{t.body}</span>
                </button>
                <button
                  type="button"
                  style={templateDeleteBtn}
                  onClick={() => handleDeleteTemplate(t.id)}
                  disabled={deletingId === t.id}
                  aria-label="Borrar plantilla"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
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
const actionsRow: React.CSSProperties = { display: "flex", gap: "0.6rem", flexWrap: "wrap" };
const submitBtn: React.CSSProperties = {
  flex: 1, background: "#1b4de0", color: "#fff", border: "none", borderRadius: 8,
  padding: "0.65rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
};
const saveBtn: React.CSSProperties = {
  background: "#fff", color: "#1b4de0", border: "1px solid #c7d5f9", borderRadius: 8,
  padding: "0.65rem 0.9rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
};
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626", margin: 0 };
const successStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#166534", margin: 0 };

const templatesWrap: React.CSSProperties = { marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid #f3f4f6" };
const templatesTitle: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" };
const templatesList: React.CSSProperties = { listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" };
const templateItem: React.CSSProperties = { display: "flex", alignItems: "stretch", gap: "0.4rem" };
const templateUseBtn: React.CSSProperties = {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8,
  padding: "0.55rem 0.75rem", cursor: "pointer", textAlign: "left",
};
const templateItemTitle: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 700, color: "#111" };
const templateItemBody: React.CSSProperties = {
  fontSize: "0.78rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis",
  whiteSpace: "nowrap", maxWidth: "100%",
};
const templateDeleteBtn: React.CSSProperties = {
  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  width: 34, background: "none", border: "1px solid #e5e7eb", borderRadius: 8,
  color: "#9ca3af", cursor: "pointer",
};
