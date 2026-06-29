"use client";

import { useState, FormEvent, KeyboardEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n";
import ImageUploader from "./ImageUploader";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

type T = Dictionary["admin"]["developments"];

const COMMON_AMENITIES = [
  "Piscina", "Gimnasio", "SUM", "Seguridad 24hs", "Cochera", "Laundry",
  "Parrilla", "Coworking", "Solarium", "Pet friendly", "Ascensor", "Terraza",
];

export type Initial = {
  id: number;
  name: string;
  address: string;
  neighborhood?: string | null;
  city?: string | null;
  description?: string;
  completion_date?: string;
  status: string;
  amenities?: string[];
  images?: string[];
  featured?: boolean;
};

type Props = { t: T; lang: string; initial?: Initial; existingImages?: string[] };

export default function DevelopmentForm({ t, lang, initial, existingImages = [] }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [completionDate, setCompletionDate] = useState(
    initial?.completion_date ? new Date(initial.completion_date).toISOString().slice(0, 10) : ""
  );
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities ?? []);
  const [amenityInput, setAmenityInput] = useState("");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const amenityRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function addAmenity(value: string) {
    const trimmed = value.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities((prev) => [...prev, trimmed]);
    }
    setAmenityInput("");
  }

  function removeAmenity(item: string) {
    setAmenities((prev) => prev.filter((a) => a !== item));
  }

  function toggleAmenity(item: string) {
    setAmenities((prev) => (prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]));
  }

  function handleAmenityKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addAmenity(amenityInput);
    } else if (e.key === "Backspace" && amenityInput === "" && amenities.length > 0) {
      setAmenities((prev) => prev.slice(0, -1));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Flush any pending amenity input
    if (amenityInput.trim()) addAmenity(amenityInput);

    if (!name.trim() || !address.trim()) {
      setError(t.form.errorRequired);
      return;
    }

    setLoading(true);

    const body = {
      name: name.trim(),
      address: address.trim(),
      neighborhood: neighborhood.trim() || null,
      city: city.trim() || null,
      description: description.trim() || null,
      completion_date: completionDate || null,
      status,
      projected_value_usd: null,
      projected_gain_pct: null,
      amenities,
      images,
      featured,
    };

    const url = isEdit ? `/api/admin/developments/${initial!.id}` : "/api/admin/developments";
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

    const id = isEdit ? initial!.id : data.id;
    router.push(`/${lang}/admin/developments/${id}`);
    router.refresh();
  }

  return (
    <div style={wrap}>
      <h1 style={title}>{isEdit ? t.form.titleEdit : t.form.titleNew}</h1>

      <form onSubmit={handleSubmit} style={form}>
        <Row>
          <Field label={t.form.name}>
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label={t.form.address}>
            <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} required />
          </Field>
        </Row>

        <Row>
          <Field label="Barrio">
            <input style={input} value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Palermo" />
          </Field>
          <Field label="Ciudad">
            <input style={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Buenos Aires" />
          </Field>
        </Row>

        <Field label={t.form.description}>
          <textarea
            style={{ ...input, minHeight: 80, resize: "vertical" }}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Row>
          <Field label={t.form.completionDate}>
            <input style={input} type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
          </Field>
          <Field label={t.form.status}>
            <select style={input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">{t.status.active}</option>
              <option value="completed">{t.status.completed}</option>
              <option value="cancelled">{t.status.cancelled}</option>
            </select>
          </Field>
        </Row>

        {/* Featured toggle */}
        <label style={featuredLabel}>
          <div style={toggle(featured)} onClick={() => setFeatured(!featured)}>
            <div style={toggleThumb(featured)} />
          </div>
          <span>
            <strong>Destacado en la home</strong>
            <span style={{ color: "#9ca3af", marginLeft: "0.5rem", fontSize: "0.82rem" }}>
              Aparece en la sección "Emprendimientos destacados"
            </span>
          </span>
        </label>

        {/* Amenities checkboxes */}
        <Field label={t.form.amenities}>
          <div style={checkboxGrid}>
            {COMMON_AMENITIES.map((a) => (
              <label key={a} style={checkboxLabel}>
                <input
                  type="checkbox"
                  checked={amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                />
                {a}
              </label>
            ))}
          </div>

          {/* Custom extra amenities not in the common list */}
          <div
            style={{ ...chipBox, marginTop: "0.6rem" }}
            onClick={() => amenityRef.current?.focus()}
          >
            {amenities.filter((a) => !COMMON_AMENITIES.includes(a)).map((a) => (
              <span key={a} style={chip}>
                {a}
                <button
                  type="button"
                  onClick={() => removeAmenity(a)}
                  style={chipRemove}
                  aria-label={`Remove ${a}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={amenityRef}
              style={chipInput}
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyDown={handleAmenityKeyDown}
              onBlur={() => addAmenity(amenityInput)}
              placeholder="Otro amenity…"
            />
          </div>
          <p style={hint}>Marcá las opciones que apliquen o agregá otras personalizadas (Enter o coma)</p>
        </Field>

        <Field label="Fotos">
          <ImageUploader images={images} onChange={setImages} existingImages={existingImages} />
        </Field>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={actions}>
          {isEdit && (
            <DeleteWithConfirmButton
              deleteUrl={`/api/admin/developments/${initial!.id}`}
              confirmText={initial!.name}
              redirectTo={`/${lang}/admin/developments`}
            />
          )}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => router.back()} style={btnSecondary}>
            {t.form.cancel}
          </button>
          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? t.form.submitting : t.form.submit}
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

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>{children}</div>;
}

const featuredLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", userSelect: "none" };
const toggle = (on: boolean): React.CSSProperties => ({
  width: 44, height: 24, borderRadius: 999, background: on ? "#111" : "#d1d5db",
  position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
});
const toggleThumb = (on: boolean): React.CSSProperties => ({
  position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18,
  borderRadius: "50%", background: "#fff", transition: "left 0.2s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
});
const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb" };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none",
};
const checkboxGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.5rem",
};
const checkboxLabel: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem",
  color: "#374151", cursor: "pointer", userSelect: "none",
};
const chipBox: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center",
  padding: "0.45rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8,
  minHeight: 42, cursor: "text",
};
const chip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  padding: "0.2rem 0.55rem", background: "#111", color: "#fff",
  borderRadius: 999, fontSize: "0.8rem", fontWeight: 500,
};
const chipRemove: React.CSSProperties = {
  background: "none", border: "none", color: "#fff", cursor: "pointer",
  fontSize: "1rem", lineHeight: 1, padding: 0, display: "flex", alignItems: "center",
};
const chipInput: React.CSSProperties = {
  border: "none", outline: "none", fontSize: "0.9rem",
  flex: 1, minWidth: 120, background: "transparent",
};
const hint: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.2rem" };
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
