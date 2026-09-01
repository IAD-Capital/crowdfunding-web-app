"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BuyDrawer from "./BuyDrawer";
import {
  Building2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { getTierDefs, unitQualifiesForTier, MIN_ENTRY_PCT, type TierThresholds, type TierKey } from "@/lib/investmentTiers";
import { trackCtaClick } from "@/lib/analytics";
import FavoriteButton from "./FavoriteButton";

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
  developer_id?: number | null;
  developer_name?: string | null;
  slug?: string | null;
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
  hasPhone?: boolean;
  myInvestedUnitIds?: number[];
  isAuthenticated?: boolean;
  myFavoriteUnitIds?: number[];
  lang: string;
  tierThresholds: TierThresholds;
};

const STATUS_UNIT: Record<string, { bg: string; fg: string; label: string }> = {
  available: { bg: "var(--c-positive)", fg: "#fff", label: "Disponible" },
  partial:   { bg: "#d9a531", fg: "#fff", label: "Parcial" },
  sold:      { bg: "#991b1b", fg: "#fff", label: "Vendida" },
};

export default function CatalogSection({ developments, units, isInvestor, hasPhone = true, myInvestedUnitIds = [], isAuthenticated = false, myFavoriteUnitIds = [], lang, tierThresholds }: Props) {
  const [tierFilter, setTierFilter] = useState<TierKey | "all">("all");
  const [drawerUnit, setDrawerUnit] = useState<Unit | null>(null);

  const tierDefs = getTierDefs(tierThresholds);

  const visibleUnits = tierFilter === "all"
    ? units
    : units.filter((u) => {
        const tier = tierDefs.find((t) => t.key === tierFilter);
        return tier ? unitQualifiesForTier(u, tier) : true;
      });
  const availableUnits = visibleUnits.filter((u) => u.status !== "sold");
  const drawerDev = drawerUnit ? developments.find((d) => d.id === drawerUnit.development_id) : null;

  return (
    <section style={section}>
      <style>{`
        @media (max-width: 760px) {
          .unit-grid {
            display: flex !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 1rem;
            padding-bottom: 0.25rem;
            margin: 0 -1.5rem;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
          .unit-grid::-webkit-scrollbar { display: none; }
          .unit-card-item {
            flex: 0 0 84%;
            scroll-snap-align: start;
          }
        }
      `}</style>
      <div style={inner}>

        {/* ── Departamentos ───────────────────────── */}
        <div style={blockHeader}>
          <div>
            <h2 style={blockTitle}>Departamentos</h2>
            <p style={blockSub}>{units.length} unidad{units.length !== 1 ? "es" : ""} en total</p>
          </div>
        </div>

        {/* Filter by investment tier */}
        <div style={tierFilterBlock}>
          <div style={tierFilterHeader}>
            <h3 style={tierFilterTitle}>¿Cuánto querés invertir?</h3>
            <p style={tierFilterSub}>
              Elegí el nivel que se ajusta a tu capital. {availableUnits.length} unidad{availableUnits.length !== 1 ? "es" : ""} disponible{availableUnits.length !== 1 ? "s" : ""} en total.
            </p>
            {tierFilter !== "all" && (
              <button style={tierClearBtn} onClick={() => setTierFilter("all")}>
                Ver todos
              </button>
            )}
          </div>
          <div style={tierCardGrid}>
            {tierDefs.map((t) => {
              const active = tierFilter === t.key;
              const count = units.filter((u) => unitQualifiesForTier(u, t)).length;
              return (
                <button
                  key={t.key}
                  style={tierCard(t.key, active)}
                  onClick={() => setTierFilter(active ? "all" : t.key)}
                >
                  <span style={tierCardTopRow}>
                    <span style={tierCardDot(t.key)} />
                    <span style={tierCardLabel(t.key)}>{t.label}</span>
                  </span>
                  <span style={tierCardRange(t.key)}>
                    {t.key === "platinum" ? "100% de la unidad" : `Desde USD ${t.from.toLocaleString("es-AR")}`}
                  </span>
                  <span style={tierCardCount(t.key, active)}>
                    {count} unidad{count !== 1 ? "es" : ""} disponible{count !== 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {isInvestor && availableUnits.length > 0 && (
          <p style={investorHint}>
            Como inversor podés adquirir entre el 5% y el 100% de cada departamento.
            Seleccioná uno para calcular tu inversión.
          </p>
        )}

        {visibleUnits.length === 0 ? (
          <p style={emptyMsg}>No hay unidades disponibles en este momento.</p>
        ) : (
          <div style={unitGrid} className="unit-grid">
            {visibleUnits.map((u) => (
              <div key={u.id} className="unit-card-item">
                <UnitCard
                  u={u}
                  devName={developments.find((d) => d.id === u.development_id)?.name ?? ""}
                  devAddress={developments.find((d) => d.id === u.development_id)?.address ?? ""}
                  devSlug={developments.find((d) => d.id === u.development_id)?.slug ?? u.development_id}
                  isInvestor={isInvestor}
                  alreadyInvested={myInvestedUnitIds.includes(u.id)}
                  onInvest={() => setDrawerUnit(u)}
                  lang={lang}
                  isAuthenticated={isAuthenticated}
                  isFavorited={myFavoriteUnitIds.includes(u.id)}
                />
              </div>
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
          hasPhone={hasPhone}
          onClose={() => setDrawerUnit(null)}
        />
      )}
    </section>
  );
}

/* ─── Unit card ─────────────────────────────────── */
function UnitCard({
  u, devName, devAddress, devSlug, isInvestor, alreadyInvested, onInvest, lang, isAuthenticated, isFavorited,
}: {
  u: Unit; devName: string; devAddress: string; devSlug: string | number; isInvestor: boolean;
  alreadyInvested: boolean; onInvest: () => void; lang: string;
  isAuthenticated: boolean; isFavorited: boolean;
}) {
  const sc = STATUS_UNIT[u.status] ?? { bg: "#f3f4f6", fg: "#374151", label: u.status };
  const canBuy = isInvestor && u.status !== "sold" && !alreadyInvested;
  const floorLabel = u.floor == null ? null : u.floor === 0 ? "Planta baja" : `Piso ${u.floor}`;

  const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;
  const entryPrice = u.price_usd;
  const currentPrice = u.current_price_usd ?? null;
  const hasCurrent = currentPrice != null && currentPrice !== entryPrice;
  const gain = hasCurrent ? ((currentPrice! - entryPrice) / entryPrice) * 100 : 0;
  const positive = gain >= 0;
  const minInvest = entryPrice != null ? Math.round((currentPrice ?? entryPrice) * MIN_ENTRY_PCT) : null;

  return (
    <div style={unitCard}>
      <Link
        href={`/${lang}/developments/${devSlug}/units/${u.id}`}
        style={unitLink}
        onClick={() => trackCtaClick("catalog_unit_card", { label: u.identifier, location: "catalog" })}
      >
        <UnitCoverSlider
          images={u.images}
          identifier={u.identifier}
          statusBadge={{ background: sc.bg, color: sc.fg, label: sc.label }}
          unitId={u.id}
          isFavorited={isFavorited}
          isAuthenticated={isAuthenticated}
          lang={lang}
        />
        <div style={unitBody}>
          <div style={unitTopRow}>
            <h3 style={unitId}>{u.identifier}</h3>
            {floorLabel && <span style={unitFloorLabel}>{floorLabel}</span>}
          </div>
          <div style={unitAddrLine}>{devName} — {devAddress.toUpperCase()}</div>

          <div style={unitStats}>
            {u.total_m2 != null && <span style={statChip}>{u.total_m2.toLocaleString("es-AR", { minimumFractionDigits: 2 })} m²</span>}
            {u.rooms != null && <span style={statChip}>{u.rooms} amb.</span>}
            {u.bedrooms != null && <span style={statChip}>{u.bedrooms} dorm.</span>}
          </div>

          {hasCurrent && (
            <div style={{ ...yieldBadge, background: positive ? "var(--c-positive-light)" : "#fee2e2", color: positive ? "var(--c-positive)" : "#991b1b" }}>
              <span>{positive ? "▲" : "▼"} {Math.abs(gain).toFixed(1)}% sobre el valor original</span>
            </div>
          )}
        </div>
      </Link>

      {entryPrice != null && (
        <div style={unitPriceRow}>
          <Link
            href={`/${lang}/developments/${devSlug}/units/${u.id}`}
            style={{ textDecoration: "none" }}
            onClick={() => trackCtaClick("catalog_unit_price", { label: u.identifier, location: "catalog" })}
          >
            <div style={priceSublabel}>Precio de entrada</div>
            <div style={priceEntry}>{fmtUsd(entryPrice)}</div>
            {minInvest != null && <div style={minInvestLabel}>Invertí desde {fmtUsd(minInvest)}</div>}
          </Link>
          {canBuy ? (
            <button
              style={btnInvest}
              onClick={() => {
                trackCtaClick("catalog_invest_button", { label: u.identifier, location: "catalog" });
                onInvest();
              }}
            >
              Invertir →
            </button>
          ) : alreadyInvested ? (
            <a
              href={`/${lang}/wallet`}
              style={btnAlready}
              onClick={() => trackCtaClick("catalog_already_invested", { label: u.identifier, location: "catalog" })}
            >
              Ya invertido →
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ─── Unit cover slider ──────────────────────────── */
function UnitCoverSlider({
  images, identifier, statusBadge, unitId, isFavorited, isAuthenticated, lang,
}: {
  images: string[] | undefined;
  identifier: string;
  statusBadge: { background: string; color: string; label: string };
  unitId: number;
  isFavorited: boolean;
  isAuthenticated: boolean;
  lang: string;
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
        <Image src={list[index]} alt={identifier} fill style={{ objectFit: "cover" }} sizes="(max-width: 760px) 84vw, 300px" />
      ) : (
        <div style={unitPlaceholder}><Building2 size={28} style={{ opacity: 0.2 }} /></div>
      )}
      <span style={{ ...badge, background: statusBadge.background, color: statusBadge.color }}>
        {statusBadge.label}
      </span>

      <FavoriteButton
        unitId={unitId}
        initialFavorited={isFavorited}
        isAuthenticated={isAuthenticated}
        lang={lang}
        label={identifier}
        location="catalog"
      />

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

/* ─── Styles ────────────────────────────────────── */
const section: React.CSSProperties = { background: "var(--c-bg)", padding: "1.5rem 1.5rem 5rem" };
const inner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

const blockHeader: React.CSSProperties = { marginBottom: "1.75rem" };
const blockTitle: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.25rem", letterSpacing: "-0.03em", color: "var(--c-ink)" };
const blockSub: React.CSSProperties = { fontSize: "0.9rem", color: "var(--c-text-tertiary)", margin: 0 };

const emptyMsg: React.CSSProperties = { color: "var(--c-text-tertiary)", fontSize: "0.95rem" };

const tierFilterBlock: React.CSSProperties = { marginBottom: "2rem" };
const tierFilterHeader: React.CSSProperties = { textAlign: "center", marginBottom: "1.75rem" };
const tierFilterTitle: React.CSSProperties = { fontSize: "2.1rem", fontWeight: 800, color: "var(--c-ink)", margin: "0 0 0.5rem", letterSpacing: "-0.02em" };
const tierFilterSub: React.CSSProperties = { fontSize: "1rem", color: "var(--c-text-secondary)", margin: 0 };
const tierClearBtn: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 600, color: "var(--c-text-secondary)", background: "none",
  border: "none", cursor: "pointer", textDecoration: "underline", marginTop: "0.5rem",
};

const TIER_META: Record<string, { dot: string; activeBorder: string; dark?: boolean }> = {
  bronze:   { dot: "#c08457", activeBorder: "#c08457" },
  silver:   { dot: "#9aa7b5", activeBorder: "#9aa7b5" },
  gold:     { dot: "#d9a531", activeBorder: "#d9a531" },
  platinum: { dot: "#7fa0ff", activeBorder: "#7fa0ff", dark: true },
};

const tierCardGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem",
};
const tierCard = (key: string, active: boolean): React.CSSProperties => {
  const m = TIER_META[key];
  if (m.dark) {
    return {
      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem",
      padding: "1rem 1.1rem", borderRadius: 14, cursor: "pointer", textAlign: "left",
      border: `2px solid ${active ? m.activeBorder : "var(--c-ink)"}`,
      background: "var(--c-ink)",
      boxShadow: active ? `0 2px 10px ${m.activeBorder}55` : "none",
      transition: "all 0.15s",
    };
  }
  return {
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem",
    padding: "1rem 1.1rem", borderRadius: 14, cursor: "pointer", textAlign: "left",
    border: `2px solid ${active ? m.activeBorder : "var(--c-border)"}`,
    background: "#fff",
    boxShadow: active ? `0 2px 10px ${m.activeBorder}33` : "0 1px 3px rgba(14,23,38,0.04)",
    transition: "all 0.15s",
  };
};
const tierCardTopRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" };
const tierCardDot = (key: string): React.CSSProperties => ({
  width: 9, height: 9, borderRadius: "50%", background: TIER_META[key].dot, flexShrink: 0,
});
const tierCardLabel = (key: string): React.CSSProperties => ({
  fontSize: "0.95rem", fontWeight: 700, color: TIER_META[key].dark ? "#fff" : "var(--c-ink)",
});
const tierCardRange = (key: string): React.CSSProperties => ({
  fontSize: "0.78rem", color: TIER_META[key].dark ? "var(--c-text-on-dark)" : "var(--c-text-tertiary)", fontWeight: 600,
});
const tierCardCount = (key: string, active: boolean): React.CSSProperties => ({
  fontSize: "0.72rem", fontWeight: 700, marginTop: "0.3rem",
  color: TIER_META[key].dark ? "var(--c-text-on-dark)" : (active ? "var(--c-ink)" : "var(--c-text-tertiary)"),
});
const investorHint: React.CSSProperties = {
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
  padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#92400e",
  marginBottom: "1.25rem",
};

const unitLink: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" };

/* Unit card */
const unitGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: "1.5rem" };
const unitCard: React.CSSProperties = {
  background: "var(--c-surface)", borderRadius: 14, overflow: "hidden",
  border: "1px solid var(--c-border)", display: "flex", flexDirection: "column",
  boxShadow: "0 2px 8px rgba(14,23,38,0.06)", transition: "border-color 0.15s, box-shadow 0.15s",
};
const unitCover: React.CSSProperties = { position: "relative", height: 160, background: "#eef1f6" };
const unitPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e8eef7,#dfe7f2)" };
const badge: React.CSSProperties = { position: "absolute", top: 10, left: 10, padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700 };
const unitBody: React.CSSProperties = { padding: "1.1rem 1.2rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.4rem" };
const unitTopRow: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" };
const unitFloorLabel: React.CSSProperties = { fontSize: "0.78rem", color: "var(--c-text-tertiary)", fontWeight: 600, whiteSpace: "nowrap" };
const unitAddrLine: React.CSSProperties = { fontSize: "0.75rem", color: "var(--c-text-secondary)", margin: "0 0 0.3rem" };
const unitId: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "var(--c-ink)" };
const unitStats: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.3rem" };
const unitPriceRow: React.CSSProperties = {
  display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "0.75rem",
  padding: "0.9rem 1.2rem 1.1rem", borderTop: "1px solid var(--c-border-soft)", marginTop: "0.4rem",
};
const statChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  fontSize: "0.75rem", padding: "0.15rem 0.55rem", background: "var(--c-chip-bg)", color: "var(--c-ink)", borderRadius: 999,
  border: "1px solid var(--c-border)",
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
const priceSublabel: React.CSSProperties = { fontSize: "0.72rem", color: "var(--c-text-tertiary)", margin: "0 0 0.2rem", fontWeight: 600 };
const priceEntry: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--c-ink)", margin: 0 };
const minInvestLabel: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 700, color: "var(--c-accent)",
  margin: "0.15rem 0 0", display: "inline-block",
};
const yieldBadge: React.CSSProperties = { display: "flex", alignItems: "center", borderRadius: 8, padding: "0.35rem 0.6rem", fontSize: "0.75rem", fontWeight: 700, marginTop: "0.5rem" };
const btnInvest: React.CSSProperties = {
  padding: "0.7rem 1rem", background: "var(--c-accent-light)",
  border: "none", borderRadius: 10, fontWeight: 700,
  fontSize: "0.85rem", cursor: "pointer", color: "var(--c-accent)", transition: "all 0.15s",
  textAlign: "center", whiteSpace: "nowrap", flexShrink: 0,
};
const btnAlready: React.CSSProperties = {
  padding: "0.7rem 1rem", textAlign: "center",
  background: "var(--c-positive-light)", border: "none", borderRadius: 10,
  fontWeight: 700, fontSize: "0.82rem", color: "var(--c-positive)", textDecoration: "none",
  whiteSpace: "nowrap", flexShrink: 0,
};
