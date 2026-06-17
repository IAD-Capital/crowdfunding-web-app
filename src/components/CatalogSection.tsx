"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BuyPanel from "./BuyPanel";

type Development = {
  id: number;
  name: string;
  address: string;
  description?: string;
  status: string;
  completion_date?: string;
  amenities: string[];
  images: string[];
  unit_count: number;
};

type Unit = {
  id: number;
  development_id: number;
  identifier: string;
  floor?: number | null;
  total_m2?: number | null;
  covered_m2?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  orientation?: string | null;
  price_usd: number;
  status: string;
  images: string[];
  description?: string;
  available_pct?: number;
};

type Props = {
  developments: Development[];
  units: Unit[];
  isInvestor: boolean;
  myInvestedUnitIds?: number[];
  lang: string;
};

type Tab = "developments" | "units";

const STATUS_UNIT: Record<string, { bg: string; fg: string; label: string }> = {
  available: { bg: "#dcfce7", fg: "#166534", label: "Disponible" },
  partial:   { bg: "#fef9c3", fg: "#854d0e", label: "Parcial" },
  sold:      { bg: "#fee2e2", fg: "#991b1b", label: "Vendida" },
};

export default function CatalogSection({ developments, units, isInvestor, myInvestedUnitIds = [], lang }: Props) {
  const [tab, setTab] = useState<Tab>("developments");
  const [devFilter, setDevFilter] = useState<number | "all">("all");
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  const visibleUnits = devFilter === "all" ? units : units.filter((u) => u.development_id === devFilter);
  const availableUnits = visibleUnits.filter((u) => u.status !== "sold");

  return (
    <section style={section}>
      <div style={inner}>
        <h2 style={sectionTitle}>Catálogo completo</h2>

        {/* Tabs */}
        <div style={tabs}>
          <button style={tabBtn(tab === "developments")} onClick={() => setTab("developments")}>
            Emprendimientos ({developments.length})
          </button>
          <button style={tabBtn(tab === "units")} onClick={() => setTab("units")}>
            Departamentos ({units.length})
          </button>
        </div>

        {tab === "developments" ? (
          <div style={devGrid}>
            {developments.map((d) => (
              <DevCard key={d.id} d={d} lang={lang} />
            ))}
          </div>
        ) : (
          <>
            {/* Filter by development */}
            {developments.length > 1 && (
              <div style={filterRow}>
                <button style={filterChip(devFilter === "all")} onClick={() => setDevFilter("all")}>
                  Todos
                </button>
                {developments.map((d) => (
                  <button
                    key={d.id}
                    style={filterChip(devFilter === d.id)}
                    onClick={() => setDevFilter(d.id)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            )}

            {isInvestor && availableUnits.length > 0 && (
              <p style={investorHint}>
                💡 Como inversor podés adquirir entre el 5% y el 100% de cada departamento.
                Seleccioná uno para calcular tu inversión.
              </p>
            )}

            <div style={unitGrid}>
              {visibleUnits.map((u) => (
                <div key={u.id} style={unitCardWrap}>
                  <UnitCard
                    u={u}
                    devName={developments.find((d) => d.id === u.development_id)?.name ?? ""}
                    isInvestor={isInvestor}
                    selected={selectedUnit === u.id}
                    onSelect={() => setSelectedUnit(selectedUnit === u.id ? null : u.id)}
                    lang={lang}
                  />
                  {isInvestor && selectedUnit === u.id && u.status !== "sold" && (
                    myInvestedUnitIds.includes(u.id) ? (
                      <div style={alreadyNote}>
                        Ya tenés una participación activa en esta unidad.{" "}
                        <a href={`/${lang}/wallet`} style={{ color: "#166534", fontWeight: 700 }}>Ver cartera →</a>
                      </div>
                    ) : (
                      <BuyPanel
                        unitId={u.id}
                        priceUsd={u.price_usd}
                        identifier={u.identifier}
                        lang={lang}
                        availablePct={u.available_pct ?? 100}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ─── Dev card ─────────────────────────────────── */
function DevCard({ d, lang }: { d: Development; lang: string }) {
  const fmtDate = d.completion_date
    ? new Date(d.completion_date).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
    : null;

  return (
    <Link href={`/${lang}/emprendimientos/${d.id}`} style={devCard}>
      <div style={devCover}>
        {d.images?.[0] ? (
          <Image src={d.images[0]} alt={d.name} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={devPlaceholder}><span style={{ fontSize: "2rem", opacity: 0.2 }}>🏢</span></div>
        )}
        {d.images?.length > 1 && (
          <span style={photoBadge}>📷 {d.images.length}</span>
        )}
      </div>
      <div style={devBody}>
        <h3 style={devName}>{d.name}</h3>
        <p style={devAddr}>{d.address}</p>
        <div style={devStats}>
          <span style={statChip}>🏠 {d.unit_count} unidades</span>
          {fmtDate && <span style={statChip}>📅 {fmtDate}</span>}
        </div>
        {d.amenities?.length > 0 && (
          <div style={amenRow}>
            {d.amenities.slice(0, 3).map((a) => (
              <span key={a} style={amenChip}>{a}</span>
            ))}
            {d.amenities.length > 3 && (
              <span style={{ ...amenChip, color: "#9ca3af" }}>+{d.amenities.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Unit card ─────────────────────────────────── */
function UnitCard({
  u, devName, isInvestor, selected, onSelect, lang,
}: {
  u: Unit; devName: string; isInvestor: boolean;
  selected: boolean; onSelect: () => void; lang: string;
}) {
  const sc = STATUS_UNIT[u.status] ?? { bg: "#f3f4f6", fg: "#374151", label: u.status };
  const canBuy = isInvestor && u.status !== "sold";

  return (
    <div style={{ ...unitCard, ...(selected ? { borderColor: "#111", boxShadow: "0 0 0 2px #111" } : {}) }}>
      <Link href={`/${lang}/emprendimientos/${u.development_id}/unidades/${u.id}`} style={unitLink}>
        <div style={unitCover}>
          {u.images?.[0] ? (
            <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} />
          ) : (
            <div style={unitPlaceholder}><span style={{ fontSize: "1.5rem", opacity: 0.15 }}>🏠</span></div>
          )}
          <span style={{ ...badge, background: sc.bg, color: sc.fg }}>{sc.label}</span>
        </div>
        <div style={unitBody}>
          <p style={devNameLabel}>{devName}</p>
          <h3 style={unitId}>{u.identifier}</h3>
          <div style={unitStats}>
            {u.floor != null && <span style={statChip}>Piso {u.floor}</span>}
            {u.total_m2 != null && <span style={statChip}>{u.total_m2} m²</span>}
            {u.rooms != null && <span style={statChip}>{u.rooms} amb.</span>}
            {u.bedrooms != null && <span style={statChip}>{u.bedrooms} dorm.</span>}
          </div>
          <p style={priceLabel}>
            {u.price_usd != null
              ? `USD ${Number(u.price_usd).toLocaleString("es-AR")}`
              : "Consultar"}
          </p>
        </div>
      </Link>
      {canBuy && (
        <div style={{ padding: "0 0.875rem 0.875rem" }}>
          <button
            style={{ ...btnInvest, ...(selected ? { background: "#111", color: "#fff" } : {}) }}
            onClick={(e) => { e.preventDefault(); onSelect(); }}
          >
            {selected ? "✕ Cerrar" : "Invertir →"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ────────────────────────────────────── */
const section: React.CSSProperties = { background: "#f9fafb", padding: "5rem 1.5rem" };
const inner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };
const sectionTitle: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 800, marginBottom: "1.5rem", letterSpacing: "-0.03em" };
const tabs: React.CSSProperties = { display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "2px solid #e5e7eb", paddingBottom: "0" };
const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "0.6rem 1.25rem", background: "none", border: "none",
  borderBottom: active ? "2px solid #111" : "2px solid transparent",
  marginBottom: "-2px", fontWeight: active ? 700 : 500,
  fontSize: "0.95rem", color: active ? "#111" : "#6b7280",
  cursor: "pointer", transition: "all 0.15s",
});
const filterRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" };
const filterChip = (active: boolean): React.CSSProperties => ({
  padding: "0.3rem 0.75rem", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600,
  cursor: "pointer", border: `1.5px solid ${active ? "#111" : "#d1d5db"}`,
  background: active ? "#111" : "#fff", color: active ? "#fff" : "#374151",
});
const investorHint: React.CSSProperties = {
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
  padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#92400e",
  marginBottom: "1.25rem",
};

/* Dev card */
const devGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" };
const devCard: React.CSSProperties = {
  background: "#fff", borderRadius: 14, overflow: "hidden",
  border: "1px solid #e5e7eb", textDecoration: "none", color: "inherit",
  display: "flex", flexDirection: "column",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "transform 0.2s, box-shadow 0.2s",
};
const devCover: React.CSSProperties = { position: "relative", height: 200, background: "#f3f4f6" };
const devPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f9fafb,#e5e7eb)" };
const photoBadge: React.CSSProperties = { position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "0.72rem", padding: "0.15rem 0.45rem", borderRadius: 999 };
const devBody: React.CSSProperties = { padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" };
const devName: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 700, margin: 0 };
const devAddr: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", margin: 0 };
const devStats: React.CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };
const amenRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.25rem" };
const amenChip: React.CSSProperties = { fontSize: "0.72rem", padding: "0.15rem 0.5rem", background: "#f3f4f6", color: "#374151", borderRadius: 999 };

const unitLink: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" };

/* Unit card */
const unitGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" };
const unitCardWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const unitCard: React.CSSProperties = {
  background: "#fff", borderRadius: 14, overflow: "hidden",
  border: "1.5px solid #e5e7eb", display: "flex", flexDirection: "column",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "border-color 0.15s, box-shadow 0.15s",
};
const unitCover: React.CSSProperties = { position: "relative", height: 160, background: "#f3f4f6" };
const unitPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f9fafb,#e5e7eb)" };
const badge: React.CSSProperties = { position: "absolute", top: 10, left: 10, padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700 };
const unitBody: React.CSSProperties = { padding: "1rem", display: "flex", flexDirection: "column", gap: "0.35rem" };
const devNameLabel: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", margin: 0, fontWeight: 600 };
const unitId: React.CSSProperties = { fontSize: "1rem", fontWeight: 700, margin: 0 };
const unitStats: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.1rem" };
const statChip: React.CSSProperties = { fontSize: "0.75rem", padding: "0.15rem 0.5rem", background: "#f3f4f6", color: "#374151", borderRadius: 999 };
const priceLabel: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 800, color: "#111", margin: "0.25rem 0 0" };
const btnInvest: React.CSSProperties = {
  marginTop: "0.5rem", padding: "0.45rem 0", background: "#fff",
  border: "1.5px solid #111", borderRadius: 8, fontWeight: 700,
  fontSize: "0.85rem", cursor: "pointer", color: "#111", transition: "all 0.15s",
};
const alreadyNote: React.CSSProperties = {
  background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
  padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#166534", marginTop: "0.5rem",
};
