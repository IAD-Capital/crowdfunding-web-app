"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import DuplicateButton from "./DuplicateButton";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type UnitRow = {
  id: number;
  identifier: string;
  floor?: number | null;
  total_m2?: number | null;
  covered_m2?: number | null;
  uncovered_m2?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  price_usd?: number | null;
  status: string;
  images?: string[];
  development_id: number;
  development_name?: string;
};

type StatusT = { available: string; partial: string; sold: string };

type Props = {
  units: UnitRow[];
  lang: string;
  statusT: StatusT;
  priceLabel: string;
  floorLabel: string;
  roomsLabel: string;
  showDevelopment?: boolean;
  developmentLabel?: string;
};

type View = "table" | "cards";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  available: { bg: "#dcfce7", fg: "#166534" },
  partial:   { bg: "#fef9c3", fg: "#854d0e" },
  sold:      { bg: "#fee2e2", fg: "#991b1b" },
};

export default function UnitsView({
  units, lang, statusT, priceLabel, floorLabel, roomsLabel,
  showDevelopment, developmentLabel,
}: Props) {
  const [view, setView] = useState<View>("table");

  const fmtUsd = (v: number | null | undefined) =>
    v != null ? `USD ${Number(v).toLocaleString()}` : "—";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "table" ? (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {[
                  ...(showDevelopment ? [developmentLabel ?? ""] : []),
                  "ID", floorLabel, "m² tot", roomsLabel, priceLabel, "Estado", "Fotos", "",
                ].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  {showDevelopment && (
                    <td style={td}>
                      <Link href={`/${lang}/admin/developments/${u.development_id}`} style={devLink}>
                        {u.development_name}
                      </Link>
                    </td>
                  )}
                  <td style={td}><strong>{u.identifier}</strong></td>
                  <td style={td}>{u.floor ?? "—"}</td>
                  <td style={td}>{u.total_m2 ?? "—"}</td>
                  <td style={td}>{u.rooms ?? "—"}</td>
                  <td style={td}>{fmtUsd(u.price_usd)}</td>
                  <td style={td}>
                    <span style={statusBadge(u.status)}>
                      {statusT[u.status as keyof StatusT] ?? u.status}
                    </span>
                  </td>
                  <td style={td}>{u.images?.length ?? 0}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <Link href={`/${lang}/admin/developments/${u.development_id}/units/${u.id}`} style={linkPrimary}>Ver</Link>
                      <Link href={`/${lang}/admin/developments/${u.development_id}/units/${u.id}/edit`} style={linkSecondary}>Editar</Link>
                      <DuplicateButton
                        duplicateUrl={`/api/admin/units/${u.id}/duplicate`}
                        redirectBase={`/${lang}/admin/developments/${u.development_id}/units`}
                      />
                      <DeleteWithConfirmButton
                        deleteUrl={`/api/admin/units/${u.id}`}
                        confirmText={u.identifier}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={cardGrid}>
          {units.map((u) => (
            <div key={u.id} style={unitCard}>
              {/* Cover image */}
              {u.images?.[0] ? (
                <div style={unitCover}>
                  <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} />
                  <span style={photoCountBadge}>📷 {u.images.length}</span>
                </div>
              ) : (
                <div style={{ ...unitCover, background: "linear-gradient(135deg, #f9fafb, #e5e7eb)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "1.5rem", opacity: 0.2 }}>🏠</span>
                </div>
              )}

              <div style={unitBody}>
                {showDevelopment && u.development_name && (
                  <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: "0 0 0.2rem" }}>{u.development_name}</p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>{u.identifier}</h3>
                  <span style={statusBadge(u.status)}>
                    {statusT[u.status as keyof StatusT] ?? u.status}
                  </span>
                </div>

                {u.floor != null && (
                  <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.2rem 0 0" }}>
                    {floorLabel} {u.floor}
                  </p>
                )}

                <div style={statsRow}>
                  {u.total_m2 != null && <span style={statChip}>{u.total_m2} m²</span>}
                  {u.rooms != null && <span style={statChip}>{u.rooms} amb.</span>}
                  {u.bedrooms != null && <span style={statChip}>{u.bedrooms} dorm.</span>}
                </div>

                <p style={{ fontSize: "1rem", fontWeight: 700, margin: "0.5rem 0 0", color: "#111" }}>
                  {fmtUsd(u.price_usd)}
                </p>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                  <Link href={`/${lang}/admin/developments/${u.development_id}/units/${u.id}`} style={btnPrimary}>
                    Ver
                  </Link>
                  <Link href={`/${lang}/admin/developments/${u.development_id}/units/${u.id}/edit`} style={btnSecondary}>
                    Editar
                  </Link>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <DuplicateButton
                    duplicateUrl={`/api/admin/units/${u.id}/duplicate`}
                    redirectBase={`/${lang}/admin/developments/${u.development_id}/units`}
                  />
                  <DeleteWithConfirmButton
                    deleteUrl={`/api/admin/units/${u.id}`}
                    confirmText={u.identifier}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div style={toggleWrap}>
      <button onClick={() => onChange("table")} style={toggleBtn(view === "table")} title="Tabla">☰</button>
      <button onClick={() => onChange("cards")} style={toggleBtn(view === "cards")} title="Tarjetas">⊞</button>
    </div>
  );
}

function statusBadge(status: string): React.CSSProperties {
  const c = STATUS_COLORS[status] ?? { bg: "#f3f4f6", fg: "#374151" };
  return {
    display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 999,
    fontSize: "0.72rem", fontWeight: 700, background: c.bg, color: c.fg,
  };
}

const toggleWrap: React.CSSProperties = {
  display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden",
};
const toggleBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.35rem 0.7rem", border: "none", cursor: "pointer", fontSize: "1rem",
  background: active ? "#111" : "#fff", color: active ? "#fff" : "#374151",
  transition: "all 0.15s",
});

/* Table */
const tableWrap: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const th: React.CSSProperties = { padding: "0.65rem 1rem", textAlign: "left", background: "#f9fafb", fontWeight: 600, fontSize: "0.8rem", color: "#6b7280" };
const td: React.CSSProperties = { padding: "0.65rem 1rem", color: "#111" };
const devLink: React.CSSProperties = { color: "#374151", textDecoration: "none", fontWeight: 500 };
const linkPrimary: React.CSSProperties = { color: "#111", fontSize: "0.8rem", fontWeight: 600 };
const linkSecondary: React.CSSProperties = { color: "#6b7280", fontSize: "0.8rem" };

/* Cards */
const cardGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem",
};
const unitCard: React.CSSProperties = {
  background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};
const unitCover: React.CSSProperties = {
  position: "relative", height: 130, background: "#f3f4f6",
};
const photoCountBadge: React.CSSProperties = {
  position: "absolute", bottom: 6, right: 6,
  background: "rgba(0,0,0,0.55)", color: "#fff",
  fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: 999,
};
const unitBody: React.CSSProperties = { padding: "0.875rem" };
const statsRow: React.CSSProperties = { display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.4rem" };
const statChip: React.CSSProperties = {
  fontSize: "0.72rem", padding: "0.15rem 0.45rem",
  background: "#f3f4f6", color: "#374151", borderRadius: 999,
};
const btnPrimary: React.CSSProperties = {
  flex: 1, textAlign: "center", padding: "0.4rem 0", background: "#111", color: "#fff",
  borderRadius: 6, textDecoration: "none", fontSize: "0.8rem", fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  flex: 1, textAlign: "center", padding: "0.4rem 0", background: "#fff", color: "#111",
  borderRadius: 6, textDecoration: "none", fontSize: "0.8rem", fontWeight: 600,
  border: "1px solid #d1d5db",
};
