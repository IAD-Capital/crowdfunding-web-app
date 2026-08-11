"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Dev = { id: number; name: string; slug: string | null };
type Props = { lang: string; developments: Dev[] };

type Result = {
  imported: number;
  units: { id: number; identifier: string; development_id: number }[];
};

const TEMPLATE_HEADER =
  "development_slug,unit_slug,covered_m2,outdoor_m2,semi_covered_m2,total_homogeneous_m2,total_m2,price_m2,total_price,currency_price,rooms,bedrooms,bathrooms,orientation,floor,status";
const TEMPLATE_EXAMPLE =
  "incas-blvd,1A,55,10.5,5,68.25,70.5,1800,126900,USD,3,2,1,Norte,1,available";

export default function CSVImportView({ lang, developments }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const devsWithSlug = developments.filter((d) => d.slug);
  const devsWithoutSlug = developments.filter((d) => !d.slug);

  function handleFile(f: File | null) {
    setFile(f);
    setError(null);
    setDetails(null);
    setResult(null);
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDetails(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/admin/units/import", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al importar.");
      setDetails(data.details ?? null);
      return;
    }
    setResult(data);
    router.refresh();
  }

  function downloadTemplate() {
    const csv = `${TEMPLATE_HEADER}\n${TEMPLATE_EXAMPLE}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-unidades.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={wrap}>
      {/* Developments with slugs */}
      <div style={section}>
        <h2 style={sectionTitle}>Emprendimientos con slug configurado</h2>
        {devsWithSlug.length === 0 ? (
          <p style={emptyNote}>Ningún emprendimiento tiene slug aún. Editá uno para asignarle un slug antes de importar.</p>
        ) : (
          <div style={slugTable}>
            <div style={slugTableHeader}>
              <span>Emprendimiento</span>
              <span>Slug (usar en CSV)</span>
            </div>
            {devsWithSlug.map((d) => (
              <div key={d.id} style={slugTableRow}>
                <span style={{ fontWeight: 600 }}>{d.name}</span>
                <code style={slugCode}>{d.slug}</code>
              </div>
            ))}
          </div>
        )}
        {devsWithoutSlug.length > 0 && (
          <p style={warnNote}>
            {devsWithoutSlug.length} emprendimiento{devsWithoutSlug.length !== 1 ? "s" : ""} sin slug:{" "}
            {devsWithoutSlug.map((d) => (
              <Link key={d.id} href={`/${lang}/admin/developments/${d.id}/edit`} style={editLink}>
                {d.name}
              </Link>
            )).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [])}
          </p>
        )}
      </div>

      {/* Format reference */}
      <div style={section}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <h2 style={sectionTitle}>Formato del CSV</h2>
          <button style={btnSecondary} onClick={downloadTemplate}>⬇ Descargar template</button>
        </div>
        <div style={codeBlock}>
          <p style={codeLine}><strong>Obligatorias:</strong> development_slug, unit_slug, total_price</p>
          <p style={codeLine}><strong>Opcionales:</strong> covered_m2, outdoor_m2, semi_covered_m2, total_homogeneous_m2, total_m2, price_m2, currency_price, rooms, bedrooms, bathrooms, orientation, floor, status (available / partial / sold)</p>
          <p style={{ ...codeLine, marginTop: "0.75rem", fontFamily: "monospace", fontSize: "0.8rem", color: "#374151", wordBreak: "break-all" }}>
            {TEMPLATE_HEADER}
          </p>
        </div>
      </div>

      {/* Upload */}
      <div style={section}>
        <h2 style={sectionTitle}>Subir archivo</h2>
        <div
          style={{ ...dropZone, ...(file ? dropZoneActive : {}) }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0] ?? null); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, margin: "0 0 0.25rem" }}>{file.name}</p>
              <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: 0 }}>
                {(file.size / 1024).toFixed(1)} KB · Hacé click para cambiar
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 600, margin: "0 0 0.25rem" }}>Arrastrá un CSV aquí</p>
              <p style={{ color: "#9ca3af", fontSize: "0.82rem", margin: 0 }}>o hacé click para seleccionar</p>
            </div>
          )}
        </div>

        {error && (
          <div style={errorBox}>
            <p style={{ margin: "0 0 0.35rem", fontWeight: 700 }}>{error}</p>
            {details && (
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                {details.map((d, i) => <li key={i} style={{ fontSize: "0.82rem" }}>{d}</li>)}
              </ul>
            )}
          </div>
        )}

        {result && (
          <div style={successBox}>
            <p style={{ fontWeight: 700, margin: "0 0 0.35rem" }}>
              ✓ {result.imported} unidad{result.imported !== 1 ? "es" : ""} importada{result.imported !== 1 ? "s" : ""} correctamente
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
              {result.units.map((u) => (
                <span key={u.id} style={importedChip}>{u.identifier}</span>
              ))}
            </div>
            <Link href={`/${lang}/admin/units`} style={{ ...btnSecondary, display: "inline-block", marginTop: "1rem", textDecoration: "none" }}>
              Ver todas las unidades →
            </Link>
          </div>
        )}

        <div style={actions}>
          <button
            style={{ ...btnPrimary, opacity: !file || loading ? 0.5 : 1, cursor: !file || loading ? "not-allowed" : "pointer" }}
            onClick={handleImport}
            disabled={!file || loading}
          >
            {loading ? "Importando…" : "Importar unidades"}
          </button>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 760 };
const section: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.5rem" };
const sectionTitle: React.CSSProperties = { fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem", color: "#111" };

const slugTable: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" };
const slugTableHeader: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr",
  background: "#f9fafb", padding: "0.5rem 0.85rem",
  fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em",
};
const slugTableRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr",
  padding: "0.6rem 0.85rem", borderTop: "1px solid #e5e7eb", alignItems: "center",
};
const slugCode: React.CSSProperties = {
  fontFamily: "monospace", fontSize: "0.85rem", background: "#f3f4f6",
  padding: "0.15rem 0.5rem", borderRadius: 6, color: "#111",
};
const emptyNote: React.CSSProperties = { color: "#9ca3af", fontSize: "0.88rem", margin: 0 };
const warnNote: React.CSSProperties = {
  fontSize: "0.82rem", color: "#92400e", background: "#fffbeb",
  border: "1px solid #fde68a", borderRadius: 8, padding: "0.6rem 0.85rem",
  marginTop: "0.75rem", lineHeight: 1.5,
};
const editLink: React.CSSProperties = { color: "#b45309", fontWeight: 700, textDecoration: "underline" };

const codeBlock: React.CSSProperties = {
  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem",
};
const codeLine: React.CSSProperties = { fontSize: "0.85rem", color: "#374151", margin: "0 0 0.35rem", lineHeight: 1.6 };

const dropZone: React.CSSProperties = {
  border: "2px dashed #d1d5db", borderRadius: 10, padding: "2.5rem 1rem",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  marginBottom: "1rem", transition: "border-color 0.15s, background 0.15s",
};
const dropZoneActive: React.CSSProperties = { borderColor: "#111", background: "#f9fafb" };

const errorBox: React.CSSProperties = {
  background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8,
  padding: "0.85rem 1rem", marginBottom: "1rem", color: "#991b1b",
};
const successBox: React.CSSProperties = {
  background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8,
  padding: "0.85rem 1rem", marginBottom: "1rem", color: "#166534",
};
const importedChip: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 600, padding: "0.15rem 0.5rem",
  background: "#dcfce7", color: "#166534", borderRadius: 999,
};
const actions: React.CSSProperties = { display: "flex", justifyContent: "flex-end" };
const btnPrimary: React.CSSProperties = {
  padding: "0.65rem 1.5rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.45rem 0.85rem", background: "#fff", color: "#374151",
  border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
};
