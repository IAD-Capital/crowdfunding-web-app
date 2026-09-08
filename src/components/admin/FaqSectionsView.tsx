"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown } from "lucide-react";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";
import ActionsMenu from "./ActionsMenu";

export type FaqSection = {
  id: number;
  name: string;
  sort_order: number;
  faq_count: number;
};

type Props = { sections: FaqSection[]; lang: string };

export default function FaqSectionsView({ sections: initial, lang }: Props) {
  const router = useRouter();
  const [sections, setSections] = useState(initial);
  const [reordering, setReordering] = useState(false);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;

    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    setReordering(true);

    await fetch("/api/admin/faq-sections/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((s) => s.id) }),
    });

    setReordering(false);
    router.refresh();
  }

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={pageTitle}>Secciones de FAQs</h1>
          <p style={subtitle}>Agrupá las preguntas frecuentes en secciones temáticas.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link href={`/${lang}/admin/faqs`} style={btnSecondary}>
            ← Volver a FAQs
          </Link>
          <Link href={`/${lang}/admin/faqs/sections/new`} style={btnPrimary}>
            + Nueva sección
          </Link>
        </div>
      </div>

      {sections.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No hay secciones creadas todavía.</p>
      ) : (
        <div style={list}>
          {sections.map((s, i) => (
            <div key={s.id} style={row}>
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
                  disabled={i === sections.length - 1 || reordering}
                  style={iconBtn}
                  title="Bajar"
                >
                  <ArrowDown size={15} />
                </button>
              </div>

              <div style={rowContent}>
                <p style={nameText}>{s.name}</p>
                <p style={countText}>
                  {s.faq_count} pregunta{s.faq_count !== 1 ? "s" : ""}
                </p>
              </div>

              <ActionsMenu actions={[{ label: "Editar", href: `/${lang}/admin/faqs/sections/${s.id}/edit` }]}>
                <DeleteWithConfirmButton
                  menuItem
                  deleteUrl={`/api/admin/faq-sections/${s.id}`}
                  confirmText={s.name.slice(0, 60)}
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
const pageTitle: React.CSSProperties = { fontSize: "1.4rem", fontWeight: 700, margin: 0 };
const subtitle: React.CSSProperties = { color: "#6b7280", fontSize: "0.85rem", margin: "0.25rem 0 0" };
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
const nameText: React.CSSProperties = { fontWeight: 700, fontSize: "0.92rem", color: "#111", margin: 0 };
const countText: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", marginTop: "0.25rem" };
const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", textDecoration: "none",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#fff", color: "#111",
  border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", textDecoration: "none",
};
