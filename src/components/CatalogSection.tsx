"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BuyDrawer from "./BuyDrawer";
import {
  Shield, Layers, Star, Gem, Building2, Maximize2, Sofa, BedDouble,
  ChevronLeft, ChevronRight, type LucideIcon,
} from "lucide-react";
import { getTierDefs, unitQualifiesForTier, MIN_ENTRY_PCT, type TierThresholds, type TierKey } from "@/lib/investmentTiers";

export type Development = {
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

export type Unit = {
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
  current_price_usd?: number | null;
  status: string;
  images: string[];
  description?: string;
  available_pct?: number;
  group_expires_at?: string | null;
};

type Props = {
  developments: Development[];
  units: Unit[];
  isInvestor: boolean;
  myInvestedUnitIds?: number[];
  lang: string;
  tierThresholds: TierThresholds;
};

const STATUS_UNIT: Record<string, { bg: string; fg: string; label: string }> = {
  available: { bg: "#dcfce7", fg: "#166534", label: "Disponible" },
  partial:   { bg: "#fef9c3", fg: "#854d0e", label: "Parcial" },
  sold:      { bg: "#fee2e2", fg: "#991b1b", label: "Vendida" },
};

export default function CatalogSection({ developments, units, isInvestor, myInvestedUnitIds = [], lang, tierThresholds }: Props) {
  const [devFilter, setDevFilter] = useState<number | "all">("all");
  const [tierFilter, setTierFilter] = useState<TierKey | "all">("all");
  const [drawerUnit, setDrawerUnit] = useState<Unit | null>(null);

  const tierDefs = getTierDefs(tierThresholds);

  const devFiltered = devFilter === "all" ? units : units.filter((u) => u.development_id === devFilter);
  const visibleUnits = tierFilter === "all"
    ? devFiltered
    : devFiltered.filter((u) => {
        const tier = tierDefs.find((t) => t.key === tierFilter);
        return tier ? unitQualifiesForTier(u, tier) : true;
      });
  const availableUnits = visibleUnits.filter((u) => u.status !== "sold");
  const drawerDev = drawerUnit ? developments.find((d) => d.id === drawerUnit.development_id) : null;

  return (
    <section style={section}>
      <div style={inner}>

        {/* ── Emprendimientos ─────────────────────── */}
        <div style={blockHeader}>
          <div>
            <h2 style={blockTitle}>Emprendimientos</h2>
            <p style={blockSub}>{developments.length} proyecto{developments.length !== 1 ? "s" : ""} activo{developments.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {developments.length === 0 ? (
          <p style={emptyMsg}>No hay emprendimientos activos en este momento.</p>
        ) : (
          <div style={devGrid}>
            {developments.map((d) => (
              <DevCard key={d.id} d={d} lang={lang} />
            ))}
          </div>
        )}

        {/* ── Departamentos ───────────────────────── */}
        <div style={{ ...blockHeader, marginTop: "4rem" }}>
          <div>
            <h2 style={blockTitle}>Departamentos</h2>
            <p style={blockSub}>{units.length} unidad{units.length !== 1 ? "es" : ""} en total</p>
          </div>
        </div>

        {/* Filter by investment tier */}
        <div style={tierFilterBlock}>
          <div style={tierFilterHeader}>
            <h3 style={tierFilterTitle}>¿Cuánto querés invertir?</h3>
            {tierFilter !== "all" && (
              <button style={tierClearBtn} onClick={() => setTierFilter("all")}>
                Ver todos
              </button>
            )}
          </div>
          <div style={tierCardGrid}>
            {tierDefs.map((t) => {
              const active = tierFilter === t.key;
              const count = devFiltered.filter((u) => unitQualifiesForTier(u, t)).length;
              return (
                <button
                  key={t.key}
                  style={tierCard(t.key, active)}
                  onClick={() => setTierFilter(active ? "all" : t.key)}
                >
                  <span style={tierCardIconWrap(t.key)}>
                    <TierIcon tierKey={t.key} />
                  </span>
                  <span style={tierCardLabel}>{t.label}</span>
                  <span style={tierCardRange}>
                    Desde USD {t.from.toLocaleString("es-AR")}
                  </span>
                  <span style={tierCardCount(active)}>
                    {count} unidad{count !== 1 ? "es" : ""} disponible{count !== 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

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

        {visibleUnits.length === 0 ? (
          <p style={emptyMsg}>No hay unidades disponibles para este emprendimiento.</p>
        ) : (
          <div style={unitGrid}>
            {visibleUnits.map((u) => (
              <UnitCard
                key={u.id}
                u={u}
                devName={developments.find((d) => d.id === u.development_id)?.name ?? ""}
                isInvestor={isInvestor}
                alreadyInvested={myInvestedUnitIds.includes(u.id)}
                onInvest={() => setDrawerUnit(u)}
                lang={lang}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Buy Drawer ───────────────────────────── */}
      {drawerUnit && (
        <BuyDrawer
          unitId={drawerUnit.id}
          priceUsd={drawerUnit.price_usd}
          identifier={drawerUnit.identifier}
          devName={drawerDev?.name ?? ""}
          coverImg={drawerUnit.images?.[0] ?? null}
          lang={lang}
          availablePct={drawerUnit.available_pct ?? 100}
          onClose={() => setDrawerUnit(null)}
        />
      )}
    </section>
  );
}

/* ─── Tier icon ────────────────────────────────── */
const TIER_ICONS: Record<string, LucideIcon> = {
  bronze: Shield,
  silver: Layers,
  gold: Star,
  platinum: Gem,
};

function TierIcon({ tierKey }: { tierKey: string }) {
  const Icon = TIER_ICONS[tierKey];
  if (!Icon) return null;
  return <Icon size={20} strokeWidth={1.8} />;
}

/* ─── Dev card ─────────────────────────────────── */
function DevCard({ d, lang }: { d: Development; lang: string }) {
  const fmtDate = d.completion_date
    ? new Date(d.completion_date).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })
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
        <span style={devCta}>Ver emprendimiento →</span>
      </div>
    </Link>
  );
}

/* ─── Unit card ─────────────────────────────────── */
function UnitCard({
  u, devName, isInvestor, alreadyInvested, onInvest, lang,
}: {
  u: Unit; devName: string; isInvestor: boolean;
  alreadyInvested: boolean; onInvest: () => void; lang: string;
}) {
  const sc = STATUS_UNIT[u.status] ?? { bg: "#f3f4f6", fg: "#374151", label: u.status };
  const canBuy = isInvestor && u.status !== "sold" && !alreadyInvested;

  return (
    <div style={unitCard}>
      <Link href={`/${lang}/emprendimientos/${u.development_id}/unidades/${u.id}`} style={unitLink}>
        <UnitCoverSlider images={u.images} identifier={u.identifier} statusBadge={{ background: sc.bg, color: sc.fg, label: sc.label }} />
        <div style={unitBody}>
          <p style={devNameLabel}>{devName}</p>
          <h3 style={unitId}>{u.identifier}</h3>
          <div style={unitStats}>
            {u.floor != null && (
              <span style={statChip}><Building2 size={13} /> Piso {u.floor}</span>
            )}
            {u.total_m2 != null && (
              <span style={statChip}><Maximize2 size={13} /> {u.total_m2} m²</span>
            )}
            {u.rooms != null && (
              <span style={statChip}><Sofa size={13} /> {u.rooms} amb.</span>
            )}
            {u.bedrooms != null && (
              <span style={statChip}><BedDouble size={13} /> {u.bedrooms} dorm.</span>
            )}
          </div>
          <PriceBlock entryPrice={u.price_usd} currentPrice={u.current_price_usd ?? null} />
        </div>
      </Link>
      <div style={{ padding: "0 0.875rem 0.875rem" }}>
        {canBuy ? (
          <button style={btnInvest} onClick={(e) => { e.preventDefault(); onInvest(); }}>
            Invertir →
          </button>
        ) : alreadyInvested ? (
          <a href={`/${lang}/wallet`} style={btnAlready}>Ya invertido · Ver cartera →</a>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Unit cover slider ──────────────────────────── */
function UnitCoverSlider({
  images, identifier, statusBadge,
}: {
  images: string[] | undefined;
  identifier: string;
  statusBadge: { background: string; color: string; label: string };
}) {
  const [index, setIndex] = useState(0);
  const list = images ?? [];
  const hasMultiple = list.length > 1;

  function go(delta: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + list.length) % list.length);
  }

  return (
    <div style={unitCover}>
      {list.length > 0 ? (
        <Image src={list[index]} alt={identifier} fill style={{ objectFit: "cover" }} />
      ) : (
        <div style={unitPlaceholder}><Building2 size={28} style={{ opacity: 0.2 }} /></div>
      )}
      <span style={{ ...badge, background: statusBadge.background, color: statusBadge.color }}>
        {statusBadge.label}
      </span>

      {hasMultiple && (
        <>
          <button type="button" style={{ ...sliderArrow, left: 6 }} onClick={(e) => go(-1, e)} aria-label="Foto anterior">
            <ChevronLeft size={16} />
          </button>
          <button type="button" style={{ ...sliderArrow, right: 6 }} onClick={(e) => go(1, e)} aria-label="Foto siguiente">
            <ChevronRight size={16} />
          </button>
          <div style={sliderDots}>
            {list.map((_, i) => (
              <span key={i} style={sliderDot(i === index)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Price block ───────────────────────────────── */
function PriceBlock({ entryPrice, currentPrice }: { entryPrice: number | null; currentPrice: number | null }) {
  const fmtUsd = (n: number) => `USD ${n.toLocaleString("es-AR")}`;

  if (entryPrice == null) return <p style={priceLabel}>Consultar</p>;

  const hasCurrent = currentPrice != null && currentPrice !== entryPrice;
  const gain = hasCurrent ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
  const positive = gain >= 0;
  const minInvest = Math.round((currentPrice ?? entryPrice) * MIN_ENTRY_PCT);

  return (
    <div style={priceBlock}>
      <div style={priceRow}>
        <div>
          <p style={priceSublabel}>Precio de entrada</p>
          <p style={priceEntry}>{fmtUsd(entryPrice)}</p>
        </div>
        {hasCurrent && (
          <div style={{ textAlign: "right" }}>
            <p style={priceSublabel}>Precio actual</p>
            <p style={{ ...priceCurrent, color: positive ? "#166534" : "#991b1b" }}>
              {fmtUsd(currentPrice!)}
            </p>
          </div>
        )}
      </div>
      <p style={minInvestLabel}>Invertí desde {fmtUsd(minInvest)}</p>
      {hasCurrent && (
        <div style={{ ...yieldBadge, background: positive ? "#dcfce7" : "#fee2e2", color: positive ? "#166534" : "#991b1b" }}>
          <span>{positive ? "▲" : "▼"} {Math.abs(gain).toFixed(1)}% sobre el valor original</span>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ────────────────────────────────────── */
const section: React.CSSProperties = { background: "#f9fafb", padding: "5rem 1.5rem" };
const inner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

const blockHeader: React.CSSProperties = { marginBottom: "1.75rem" };
const blockTitle: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.25rem", letterSpacing: "-0.03em" };
const blockSub: React.CSSProperties = { fontSize: "0.9rem", color: "#9ca3af", margin: 0 };

const emptyMsg: React.CSSProperties = { color: "#9ca3af", fontSize: "0.95rem" };

const filterRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" };
const filterChip = (active: boolean): React.CSSProperties => ({
  padding: "0.3rem 0.75rem", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600,
  cursor: "pointer", border: `1.5px solid ${active ? "#111" : "#d1d5db"}`,
  background: active ? "#111" : "#fff", color: active ? "#fff" : "#374151",
});
const tierFilterBlock: React.CSSProperties = { marginBottom: "2rem" };
const tierFilterHeader: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.5rem" };
const tierFilterTitle: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 700, color: "#111", margin: 0 };
const tierClearBtn: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", background: "none",
  border: "none", cursor: "pointer", textDecoration: "underline",
};

const TIER_META: Record<string, { bg: string; border: string; activeBg: string }> = {
  bronze:   { bg: "#fff7ed", border: "#d97706", activeBg: "#fdebd3" },
  silver:   { bg: "#f8fafc", border: "#94a3b8", activeBg: "#e9edf2" },
  gold:     { bg: "#fefce8", border: "#ca8a04", activeBg: "#fdf3c7" },
  platinum: { bg: "#f5f3ff", border: "#7c3aed", activeBg: "#e9e2fc" },
};

const tierCardGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem",
};
const tierCard = (key: string, active: boolean): React.CSSProperties => {
  const m = TIER_META[key];
  return {
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem",
    padding: "1rem 1.1rem", borderRadius: 14, cursor: "pointer", textAlign: "left",
    border: `2px solid ${active ? m.border : "#e5e7eb"}`,
    background: active ? m.activeBg : "#fff",
    boxShadow: active ? `0 2px 10px ${m.border}33` : "0 1px 3px rgba(0,0,0,0.04)",
    transition: "all 0.15s",
  };
};
const tierCardIconWrap = (key: string): React.CSSProperties => {
  const m = TIER_META[key];
  return {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 36, height: 36, borderRadius: 10, marginBottom: "0.3rem",
    background: m.bg, color: "#111",
  };
};
const tierCardLabel: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 800, color: "#111" };
const tierCardRange: React.CSSProperties = { fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 };
const tierCardCount = (active: boolean): React.CSSProperties => ({
  fontSize: "0.72rem", fontWeight: 700, marginTop: "0.3rem",
  color: active ? "#111" : "#9ca3af",
});
const investorHint: React.CSSProperties = {
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
  padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#92400e",
  marginBottom: "1.25rem",
};

/* Dev card */
const devGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: "1.5rem" };
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
const devCta: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 700, color: "#111", marginTop: "auto", paddingTop: "0.5rem" };

const unitLink: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" };

/* Unit card */
const unitGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: "1.5rem" };
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
const statChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  fontSize: "0.75rem", padding: "0.15rem 0.55rem", background: "#f3f4f6", color: "#374151", borderRadius: 999,
};
const sliderArrow: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer",
  background: "rgba(0,0,0,0.45)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
};
const sliderDots: React.CSSProperties = {
  position: "absolute", bottom: 8, left: 0, right: 0,
  display: "flex", justifyContent: "center", gap: "0.3rem", zIndex: 2,
};
const sliderDot = (active: boolean): React.CSSProperties => ({
  width: 5, height: 5, borderRadius: "50%",
  background: active ? "#fff" : "rgba(255,255,255,0.5)",
});
const priceLabel: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 800, color: "#111", margin: "0.25rem 0 0" };

/* PriceBlock */
const priceBlock: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.35rem" };
const priceRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end" };
const priceSublabel: React.CSSProperties = { fontSize: "0.62rem", color: "#9ca3af", margin: "0 0 0.1rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
const priceEntry: React.CSSProperties = { fontSize: "0.92rem", fontWeight: 700, color: "#6b7280", margin: 0 };
const priceCurrent: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 900, margin: 0 };
const minInvestLabel: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 700, color: "#166534",
  background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6,
  padding: "0.3rem 0.55rem", margin: 0, display: "inline-block",
};
const yieldBadge: React.CSSProperties = { display: "flex", alignItems: "center", borderRadius: 8, padding: "0.35rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 };
const btnInvest: React.CSSProperties = {
  display: "block", width: "100%", padding: "0.5rem", background: "#fff",
  border: "1.5px solid #111", borderRadius: 8, fontWeight: 700,
  fontSize: "0.85rem", cursor: "pointer", color: "#111", transition: "all 0.15s",
  textAlign: "center",
};
const btnAlready: React.CSSProperties = {
  display: "block", width: "100%", padding: "0.5rem", textAlign: "center",
  background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8,
  fontWeight: 700, fontSize: "0.82rem", color: "#166534", textDecoration: "none",
};
