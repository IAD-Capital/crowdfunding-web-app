"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";
import ActionsMenu from "./ActionsMenu";

export type Faq = {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
  available_in_chatbot: boolean;
  sort_order: number;
};

type Props = { faqs: Faq[]; lang: string };

export default function FaqsView({ faqs: initial, lang }: Props) {
  const router = useRouter();
  const [faqs, setFaqs] = useState(initial);
  const [reordering, setReordering] = useState(false);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= faqs.length) return;

    const next = [...faqs];
    [next[index], next[target]] = [next[target], next[index]];
    setFaqs(next);
    setReordering(true);

    await fetch("/api/admin/faqs/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((f) => f.id) }),
    });

    setReordering(false);
    router.refresh();
  }

  return (
    <div>
      <div style={header}>
        <h1 style={pageTitle}>FAQs</h1>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link href={`/${lang}/admin/faqs/import`} style={btnSecondary}>
            Importar CSV
          </Link>
          <Link href={`/${lang}/admin/faqs/new`} style={btnPrimary}>
            + Nueva pregunta
          </Link>
        </div>
      </div>

      {faqs.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No hay preguntas frecuentes cargadas todavía.</p>
      ) : (
        <div style={list}>
          {faqs.map((f, i) => (
            <div key={f.id} style={row}>
              <div style={reorderCol}>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || reordering}
                  style={iconBtn}
                  title="Subir"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === faqs.length - 1 || reordering}
                  style={iconBtn}
                  title="Bajar"
                >
                  <ArrowDown size={15} />
                </button>
              </div>

              <div style={rowContent}>
                <p style={questionText}>{f.question}</p>
                <p style={answerText}>{f.answer}</p>
              </div>

              <div style={badges}>
                <span style={{ ...badge, ...(f.is_active ? badgeActive : badgeInactive) }}>
                  {f.is_active ? "Activa" : "Inactiva"}
                </span>
                {f.available_in_chatbot && (
                  <span style={{ ...badge, ...badgeChatbot }}>Chatbot</span>
                )}
              </div>

              <ActionsMenu actions={[{ label: "Editar", href: `/${lang}/admin/faqs/${f.id}/edit` }]}>
                <DeleteWithConfirmButton
                  menuItem
                  deleteUrl={`/api/admin/faqs/${f.id}`}
                  confirmText={f.question.slice(0, 60)}
                />
              </ActionsMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const header: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem",
};
const pageTitle: React.CSSProperties = { fontSize: "1.4rem", fontWeight: 700 };
const list: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const row: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap",
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "1rem",
};
const reorderCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.25rem", flexShrink: 0 };
const iconBtn: React.CSSProperties = {
  width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", color: "#374151",
};
const rowContent: React.CSSProperties = { flex: 1, minWidth: 0 };
const questionText: React.CSSProperties = { fontWeight: 700, fontSize: "0.92rem", color: "#111" };
const answerText: React.CSSProperties = {
  fontSize: "0.82rem", color: "#6b7280", marginTop: "0.25rem",
  overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
  WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
};
const badges: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-end", flexShrink: 0 };
const badge: React.CSSProperties = {
  fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999, whiteSpace: "nowrap",
};
const badgeActive: React.CSSProperties = { background: "#eaf7f0", color: "#0e9f6e" };
const badgeInactive: React.CSSProperties = { background: "#f3f4f6", color: "#9ca3af" };
const badgeChatbot: React.CSSProperties = { background: "#eff3ff", color: "#1b4de0" };
const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", textDecoration: "none",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#fff", color: "#111",
  border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", textDecoration: "none",
};
