"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type ChatbotQuestion = {
  id: number;
  question: string;
  answer: string | null;
  is_active: boolean;
  sort_order: number;
  child_count: number;
};

export type ParentQuestion = {
  id: number;
  question: string;
  parent_id: number | null;
};

type Props = {
  questions: ChatbotQuestion[];
  lang: string;
  parentId: number | null;
  parentQuestion?: ParentQuestion;
};

export default function ChatbotQuestionsView({ questions: initial, lang, parentId, parentQuestion }: Props) {
  const router = useRouter();
  const [questions, setQuestions] = useState(initial);
  const [reordering, setReordering] = useState(false);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;

    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
    setReordering(true);

    await fetch("/api/admin/chatbot/questions/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((q) => q.id) }),
    });

    setReordering(false);
    router.refresh();
  }

  const backHref = parentQuestion
    ? parentQuestion.parent_id
      ? `/${lang}/admin/chatbot/${parentQuestion.parent_id}/children`
      : `/${lang}/admin/chatbot`
    : null;

  const newHref = parentId
    ? `/${lang}/admin/chatbot/new?parent=${parentId}`
    : `/${lang}/admin/chatbot/new`;

  return (
    <div>
      {backHref && (
        <Link href={backHref} style={backLink}>
          <ArrowLeft size={14} /> Volver a «{parentQuestion!.question.slice(0, 60)}»
        </Link>
      )}

      <div style={header}>
        <h1 style={pageTitle}>{parentQuestion ? `Opciones de «${parentQuestion.question.slice(0, 40)}»` : "Chatbot"}</h1>
        <Link href={newHref} style={btnPrimary}>
          {parentId ? "+ Nueva opción" : "+ Nueva pregunta"}
        </Link>
      </div>

      {questions.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No hay preguntas cargadas todavía.</p>
      ) : (
        <div style={list}>
          {questions.map((q, i) => (
            <div key={q.id} style={row}>
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
                  disabled={i === questions.length - 1 || reordering}
                  style={iconBtn}
                  title="Bajar"
                >
                  <ArrowDown size={15} />
                </button>
              </div>

              <div style={rowContent}>
                <p style={questionText}>{q.question}</p>
                {q.answer && <p style={answerText}>{q.answer}</p>}
              </div>

              <span style={{ ...badge, ...(q.is_active ? badgeActive : badgeInactive) }}>
                {q.is_active ? "Activa" : "Inactiva"}
              </span>

              <div style={rowActions}>
                <Link href={`/${lang}/admin/chatbot/${q.id}/children`} style={editLink}>
                  {q.child_count > 0 ? `Ver opciones (${q.child_count})` : "+ Agregar opciones"}
                </Link>
                <Link href={`/${lang}/admin/chatbot/${q.id}/edit`} style={editLink}>
                  Editar
                </Link>
                <DeleteWithConfirmButton
                  deleteUrl={`/api/admin/chatbot/questions/${q.id}`}
                  confirmText={q.question.slice(0, 60)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const backLink: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.4rem",
  fontSize: "0.82rem", fontWeight: 600, color: "#6b7280", textDecoration: "none", marginBottom: "0.75rem",
};
const header: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem",
};
const pageTitle: React.CSSProperties = { fontSize: "1.4rem", fontWeight: 700 };
const list: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const row: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: "1rem",
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
const badge: React.CSSProperties = {
  flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 999,
};
const badgeActive: React.CSSProperties = { background: "#eaf7f0", color: "#0e9f6e" };
const badgeInactive: React.CSSProperties = { background: "#f3f4f6", color: "#9ca3af" };
const rowActions: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 };
const editLink: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 600, color: "#1b4de0", textDecoration: "none", whiteSpace: "nowrap" };
const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem", textDecoration: "none",
};
