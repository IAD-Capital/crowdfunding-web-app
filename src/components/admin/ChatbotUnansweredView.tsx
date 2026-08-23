"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type UnansweredQuestion = {
  id: number;
  question: string;
  email: string | null;
  status: "pending" | "resolved";
  created_at: string;
};

type Props = { items: UnansweredQuestion[]; lang: string };
type Tab = "pending" | "resolved" | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Pendientes" },
  { key: "resolved", label: "Resueltas" },
  { key: "all", label: "Todas" },
];

export default function ChatbotUnansweredView({ items, lang }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(
    () => (tab === "all" ? items : items.filter((i) => i.status === tab)),
    [items, tab]
  );

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    });

  async function dismiss(id: number) {
    if (!window.confirm("¿Descartar esta pregunta?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/chatbot/unanswered/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      <div style={header}>
        <h1 style={pageTitle}>Preguntas sin responder</h1>
      </div>

      <div style={tabsRow}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{ ...tabBtn, ...(tab === t.key ? tabBtnActive : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No hay preguntas en esta categoría.</p>
      ) : (
        <div style={list}>
          {filtered.map((item) => (
            <div key={item.id} style={row}>
              <div style={rowContent}>
                <p style={questionText}>{item.question}</p>
                <p style={metaText}>
                  {item.email ?? "Anónimo"} · {fmtDate(item.created_at)}
                </p>
              </div>

              <span style={{ ...badge, ...(item.status === "pending" ? badgePending : badgeResolved) }}>
                {item.status === "pending" ? "Pendiente" : "Resuelta"}
              </span>

              <div style={rowActions}>
                <Link
                  href={`/${lang}/admin/chatbot/new?prefill=${encodeURIComponent(item.question)}&fromUnanswered=${item.id}`}
                  style={promoteLink}
                >
                  Crear pregunta desde esta
                </Link>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  disabled={deletingId === item.id}
                  style={dismissBtn}
                >
                  {deletingId === item.id ? "…" : "Descartar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const header: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem",
};
const pageTitle: React.CSSProperties = { fontSize: "1.4rem", fontWeight: 700 };
const tabsRow: React.CSSProperties = { display: "flex", gap: "0.5rem", marginBottom: "1.25rem" };
const tabBtn: React.CSSProperties = {
  padding: "0.45rem 0.9rem", borderRadius: 999, border: "1px solid #e5e7eb",
  background: "#fff", color: "#6b7280", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
};
const tabBtnActive: React.CSSProperties = { background: "#eff3ff", color: "#1b4de0", borderColor: "#c7d7ff" };
const list: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const row: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: "1rem",
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem",
};
const rowContent: React.CSSProperties = { flex: 1, minWidth: 0 };
const questionText: React.CSSProperties = { fontWeight: 700, fontSize: "0.92rem", color: "#111" };
const metaText: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", marginTop: "0.25rem" };
const badge: React.CSSProperties = {
  flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999,
};
const badgePending: React.CSSProperties = { background: "#fffbeb", color: "#92400e" };
const badgeResolved: React.CSSProperties = { background: "#eaf7f0", color: "#0e9f6e" };
const rowActions: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0,
};
const promoteLink: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 600, color: "#1b4de0", textDecoration: "none", whiteSpace: "nowrap" };
const dismissBtn: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 600, color: "#dc2626", background: "none",
  border: "none", cursor: "pointer", padding: 0,
};
