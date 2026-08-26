"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type Initial = {
  id: number;
  question: string;
  answer: string;
  is_active: boolean;
  available_in_chatbot: boolean;
};

type Props = { lang: string; initial?: Initial };

export default function FaqForm({ lang, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;
  const listUrl = `/${lang}/admin/faqs`;

  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [availableInChatbot, setAvailableInChatbot] = useState(initial?.available_in_chatbot ?? false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("La pregunta es obligatoria.");
      return;
    }
    if (!answer.trim()) {
      setError("La respuesta es obligatoria.");
      return;
    }

    setLoading(true);

    const body = {
      question: question.trim(),
      answer: answer.trim(),
      is_active: isActive,
      available_in_chatbot: availableInChatbot,
    };

    const url = isEdit ? `/api/admin/faqs/${initial!.id}` : "/api/admin/faqs";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Error");
      return;
    }

    setLoading(false);
    router.push(listUrl);
    router.refresh();
  }

  return (
    <div style={wrap}>
      <h1 style={title}>{isEdit ? "Editar pregunta frecuente" : "Nueva pregunta frecuente"}</h1>

      <form onSubmit={handleSubmit} style={form}>
        <Field label="Pregunta">
          <textarea
            style={textarea}
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </Field>

        <Field label="Respuesta">
          <textarea
            style={textarea}
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
        </Field>

        <label style={checkboxLabel}>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Activa (visible en la página «¿Cómo invertir?»)
        </label>

        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={availableInChatbot}
            onChange={(e) => setAvailableInChatbot(e.target.checked)}
          />
          Disponible en el chatbot
        </label>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={actions}>
          {isEdit && (
            <DeleteWithConfirmButton
              deleteUrl={`/api/admin/faqs/${initial!.id}`}
              confirmText={initial!.question.slice(0, 60)}
              redirectTo={listUrl}
            />
          )}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => router.back()} style={btnSecondary}>
            Cancelar
          </button>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1 }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb" };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const textarea: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none",
  fontFamily: "inherit", resize: "vertical",
};
const checkboxLabel: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", cursor: "pointer", color: "#374151",
};
const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.875rem" };
const actions: React.CSSProperties = { display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" };
const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#fff", color: "#111",
  border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
};
