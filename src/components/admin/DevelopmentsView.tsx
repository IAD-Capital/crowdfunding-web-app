"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DuplicateButton from "./DuplicateButton";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type Development = {
  id: number;
  name: string;
  address: string;
  description?: string;
  completion_date?: string;
  status: string;
  amenities: string[];
  images: string[];
  unit_count: number;
  visible?: boolean;
  created_at?: string;
  updated_at?: string;
};

function fmtDate(d?: string) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

type T = {
  title: string;
  newDev: string;
  empty: string;
  units: string;
  status: Record<string, string>;
};

type Props = { developments: Development[]; t: T; lang: string };

type View = "grid" | "list";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  active:    { bg: "#dcfce7", fg: "#166534" },
  completed: { bg: "#dbeafe", fg: "#1e40af" },
  cancelled: { bg: "#fee2e2", fg: "#991b1b" },
};

export default function DevelopmentsView({ developments, t, lang }: Props) {
  const [view, setView] = useState<View>("grid");

  return (
    <div>
      {/* Header */}
      <div style={header}>
        <h1 style={pageTitle}>{t.title}</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <ViewToggle view={view} onChange={setView} />
          <Link href={`/${lang}/admin/developments/import`} style={btnSecondary}>
            ⬆ Importar CSV
          </Link>
          <Link href={`/${lang}/admin/developments/new`} style={btnPrimary}>
            + {t.newDev}
          </Link>
        </div>
      </div>

      {developments.length === 0 ? (
        <p style={{ color: "#6b7280" }}>{t.empty}</p>
      ) : view === "grid" ? (
        <GridView developments={developments} t={t} lang={lang} />
      ) : (
        <ListView developments={developments} t={t} lang={lang} />
      )}
    </div>
  );
}

/* ─── Grid ─────────────────────────────────────── */
function GridView({ developments, t, lang }: Props) {
  return (
    <div style={grid}>
      {developments.map((d) => (
        <div key={d.id} style={card}>
          <Link href={`/${lang}/admin/developments/${d.id}`} style={cardLinkArea}>
            {/* Cover image */}
            <div style={coverWrap}>
              {d.images?.[0] ? (
                <Image src={d.images[0]} alt={d.name} fill style={{ objectFit: "cover" }} />
              ) : (
                <div style={coverPlaceholder}>
                  <span style={{ fontSize: "2rem", opacity: 0.25 }}>🏢</span>
                </div>
              )}
              <span style={statusChip(d.status)}>
                {t.status[d.status] ?? d.status}
              </span>
              {d.visible === false && (
                <span style={hiddenChip}>🚫 Oculto</span>
              )}
              {d.images?.length > 0 && (
                <span style={photoCount}>📷 {d.images.length}</span>
              )}
            </div>

            {/* Body */}
            <div style={cardBody}>
              <h2 style={cardTitle}>{d.name}</h2>
              <p style={cardAddr}>{d.address}</p>

              {/* Stats */}
              <div style={statsRow}>
                <span style={stat}>🏠 {d.unit_count} {t.units}</span>
                {d.completion_date && (
                  <span style={stat}>
                    📅 {new Date(d.completion_date).toLocaleDateString("es-AR", { month: "short", year: "numeric", timeZone: "UTC" })}
                  </span>
                )}
              </div>

              {/* Amenities */}
              {d.amenities?.length > 0 && (
                <div style={amenitiesRow}>
                  {d.amenities.slice(0, 3).map((a) => (
                    <span key={a} style={amenityChip}>{a}</span>
                  ))}
                  {d.amenities.length > 3 && (
                    <span style={{ ...amenityChip, background: "#f3f4f6", color: "#9ca3af" }}>
                      +{d.amenities.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Dates */}
              {(d.created_at || d.updated_at) && (
                <p style={datesLine}>
                  {fmtDate(d.created_at) && <>Creado {fmtDate(d.created_at)}</>}
                  {fmtDate(d.created_at) && fmtDate(d.updated_at) && " · "}
                  {fmtDate(d.updated_at) && <>Actualizado {fmtDate(d.updated_at)}</>}
                </p>
              )}
            </div>
          </Link>

          {/* Actions */}
          <div style={cardActions}>
            <Link href={`/${lang}/admin/developments/${d.id}/edit`} style={actionLink}>Editar</Link>
            <DuplicateButton
              duplicateUrl={`/api/admin/developments/${d.id}/duplicate`}
              redirectBase={`/${lang}/admin/developments`}
            />
            <DeleteWithConfirmButton
              deleteUrl={`/api/admin/developments/${d.id}`}
              confirmText={d.name}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── List ─────────────────────────────────────── */
function ListView({ developments, t, lang }: Props) {
  return (
    <div style={listWrap}>
      {developments.map((d) => (
        <div key={d.id} style={listRow}>
          <Link href={`/${lang}/admin/developments/${d.id}`} style={listLinkArea}>
            {/* Thumbnail */}
            <div style={listThumb}>
              {d.images?.[0] ? (
                <Image src={d.images[0]} alt={d.name} fill style={{ objectFit: "cover", borderRadius: 8 }} />
              ) : (
                <div style={{ ...coverPlaceholder, borderRadius: 8 }}>
                  <span style={{ fontSize: "1.25rem", opacity: 0.25 }}>🏢</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>{d.name}</h2>
                <span style={statusChip(d.status)}>{t.status[d.status] ?? d.status}</span>
                {d.visible === false && (
                  <span style={hiddenChip}>🚫 Oculto</span>
                )}
              </div>
              <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 0.5rem" }}>{d.address}</p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={stat}>🏠 {d.unit_count} {t.units}</span>
                {d.completion_date && (
                  <span style={stat}>
                    📅 {new Date(d.completion_date).toLocaleDateString("es-AR", { month: "short", year: "numeric", timeZone: "UTC" })}
                  </span>
                )}
                {d.images?.length > 0 && <span style={stat}>📷 {d.images.length}</span>}
              </div>
              {d.amenities?.length > 0 && (
                <div style={{ ...amenitiesRow, marginTop: "0.4rem" }}>
                  {d.amenities.slice(0, 4).map((a) => (
                    <span key={a} style={amenityChip}>{a}</span>
                  ))}
                  {d.amenities.length > 4 && (
                    <span style={{ ...amenityChip, color: "#9ca3af" }}>+{d.amenities.length - 4}</span>
                  )}
                </div>
              )}
              {(d.created_at || d.updated_at) && (
                <p style={datesLine}>
                  {fmtDate(d.created_at) && <>Creado {fmtDate(d.created_at)}</>}
                  {fmtDate(d.created_at) && fmtDate(d.updated_at) && " · "}
                  {fmtDate(d.updated_at) && <>Actualizado {fmtDate(d.updated_at)}</>}
                </p>
              )}
            </div>
          </Link>

          {/* Actions */}
          <div style={listActions}>
            <Link href={`/${lang}/admin/developments/${d.id}/edit`} style={actionLink}>Editar</Link>
            <DuplicateButton
              duplicateUrl={`/api/admin/developments/${d.id}/duplicate`}
              redirectBase={`/${lang}/admin/developments`}
            />
            <DeleteWithConfirmButton
              deleteUrl={`/api/admin/developments/${d.id}`}
              confirmText={d.name}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── View toggle ───────────────────────────────── */
function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div style={toggleWrap}>
      <button onClick={() => onChange("grid")} style={toggleBtn(view === "grid")} title="Tarjetas">
        ⊞
      </button>
      <button onClick={() => onChange("list")} style={toggleBtn(view === "list")} title="Lista">
        ☰
      </button>
    </div>
  );
}

function statusChip(status: string): React.CSSProperties {
  const c = STATUS_COLORS[status] ?? { bg: "#f3f4f6", fg: "#374151" };
  return {
    display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 999,
    fontSize: "0.72rem", fontWeight: 700, background: c.bg, color: c.fg,
    flexShrink: 0,
  };
}

/* ─── Styles ────────────────────────────────────── */
const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700 };
const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#111", color: "#fff",
  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#fff", color: "#374151",
  border: "1px solid #d1d5db", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
};
const toggleWrap: React.CSSProperties = {
  display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden",
};
const toggleBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.4rem 0.75rem", border: "none", cursor: "pointer", fontSize: "1rem",
  background: active ? "#111" : "#fff", color: active ? "#fff" : "#374151",
  transition: "all 0.15s",
});

/* Grid */
const grid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem",
};
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, overflow: "hidden",
  border: "1px solid #e5e7eb",
  display: "flex", flexDirection: "column",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  transition: "box-shadow 0.2s, transform 0.2s",
};
const cardLinkArea: React.CSSProperties = {
  display: "flex", flexDirection: "column", textDecoration: "none", color: "inherit",
};
const cardActions: React.CSSProperties = {
  display: "flex", gap: "0.5rem", padding: "0 1rem 1rem", flexWrap: "wrap",
};
const actionLink: React.CSSProperties = {
  padding: "0.4rem 0.9rem", background: "#fff", color: "#111",
  borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: "0.8rem",
  border: "1px solid #d1d5db",
};
const coverWrap: React.CSSProperties = {
  position: "relative", height: 180, background: "#f3f4f6", flexShrink: 0,
};
const coverPlaceholder: React.CSSProperties = {
  width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
  background: "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)",
};
const datesLine: React.CSSProperties = {
  fontSize: "0.72rem", color: "#9ca3af", margin: "0.4rem 0 0",
};
const hiddenChip: React.CSSProperties = {
  display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 999,
  fontSize: "0.72rem", fontWeight: 700, background: "#f3f4f6", color: "#6b7280",
  flexShrink: 0,
};
const photoCount: React.CSSProperties = {
  position: "absolute", bottom: 8, right: 8,
  background: "rgba(0,0,0,0.55)", color: "#fff",
  fontSize: "0.72rem", padding: "0.15rem 0.45rem", borderRadius: 999,
};
const cardBody: React.CSSProperties = { padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 };
const cardTitle: React.CSSProperties = { fontSize: "1rem", fontWeight: 700, margin: 0 };
const cardAddr: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", margin: 0 };
const statsRow: React.CSSProperties = { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.25rem" };
const stat: React.CSSProperties = { fontSize: "0.78rem", color: "#6b7280" };
const amenitiesRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.3rem" };
const amenityChip: React.CSSProperties = {
  fontSize: "0.72rem", padding: "0.15rem 0.5rem",
  background: "#f3f4f6", color: "#374151", borderRadius: 999,
};

/* List */
const listWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const listRow: React.CSSProperties = {
  display: "flex", gap: "1rem", alignItems: "center",
  background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb",
  padding: "0.85rem 1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const listLinkArea: React.CSSProperties = {
  display: "flex", gap: "1rem", alignItems: "center", flex: 1, minWidth: 0,
  textDecoration: "none", color: "inherit",
};
const listActions: React.CSSProperties = {
  display: "flex", gap: "0.5rem", flexShrink: 0,
};
const listThumb: React.CSSProperties = {
  position: "relative", width: 72, height: 72, flexShrink: 0,
  borderRadius: 8, overflow: "hidden", background: "#f3f4f6",
};
