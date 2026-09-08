"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type Initial = { id: number; name: string };

type Props = { lang: string; initial?: Initial };

export default function FaqSectionForm({ lang, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;
  const listUrl = `/${lang}/admin/faqs/sections`;

  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setLoading(true);

    const url = isEdit ? `/api/admin/faq-sections/${initial!.id}` : "/api/admin/faq-sections";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
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
      <h1 style={title}>{isEdit ? "Editar sección" : "Nueva sección"}</h1>

      <form onSubmit={handleSubmit} style={form}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>Nombre</label>
          <input
            style={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Funcionamiento general"
            required
          />
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={actions}>
          {isEdit && (
            <DeleteWithConfirmButton
              deleteUrl={`/api/admin/faq-sections/${initial!.id}`}
              confirmText={initial!.name.slice(0, 60)}
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

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb" };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none", fontFamily: "inherit",
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
