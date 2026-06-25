"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type Initial = {
  id: number;
  name: string;
  website?: string | null;
  logo?: string | null;
  developments?: { id: number; name: string }[];
};

export type DevelopmentOption = { id: number; name: string };

type Props = {
  lang: string;
  initial?: Initial;
  allDevelopments: DevelopmentOption[];
};

export default function DeveloperForm({ lang, initial, allDevelopments }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [logo, setLogo] = useState<string[]>(initial?.logo ? [initial.logo] : []);
  const [developmentIds, setDevelopmentIds] = useState<number[]>(
    initial?.developments?.map((d) => d.id) ?? []
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleDevelopment(id: number) {
    setDevelopmentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setLoading(true);

    const body = {
      name: name.trim(),
      website: website.trim() || null,
      logo: logo[0] ?? null,
      development_ids: developmentIds,
    };

    const url = isEdit ? `/api/admin/developers/${initial!.id}` : "/api/admin/developers";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }

    router.push(`/${lang}/admin/developers`);
    router.refresh();
  }

  return (
    <div style={wrap}>
      <h1 style={title}>{isEdit ? "Editar desarrolladora" : "Nueva desarrolladora"}</h1>

      <form onSubmit={handleSubmit} style={form}>
        <Field label="Nombre">
          <input style={input} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>

        <Field label="Página web (opcional)">
          <input
            style={input}
            type="url"
            placeholder="https://..."
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </Field>

        <Field label="Foto de perfil">
          <ImageUploader images={logo} onChange={setLogo} max={1} />
        </Field>

        <Field label="Emprendimientos asociados">
          {allDevelopments.length === 0 ? (
            <p style={hint}>No hay emprendimientos cargados todavía.</p>
          ) : (
            <div style={checklist}>
              {allDevelopments.map((d) => (
                <label key={d.id} style={checklistItem}>
                  <input
                    type="checkbox"
                    checked={developmentIds.includes(d.id)}
                    onChange={() => toggleDevelopment(d.id)}
                  />
                  {d.name}
                </label>
              ))}
            </div>
          )}
        </Field>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={actions}>
          {isEdit && (
            <DeleteWithConfirmButton
              deleteUrl={`/api/admin/developers/${initial!.id}`}
              confirmText={initial!.name}
              redirectTo={`/${lang}/admin/developers`}
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
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none",
};
const checklist: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.5rem",
  border: "1px solid #d1d5db", borderRadius: 8, padding: "0.75rem",
  maxHeight: 260, overflowY: "auto",
};
const checklistItem: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", cursor: "pointer",
};
const hint: React.CSSProperties = { fontSize: "0.82rem", color: "#9ca3af" };
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
