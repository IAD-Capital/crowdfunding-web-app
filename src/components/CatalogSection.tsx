"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BuyDrawer from "./BuyDrawer";
import {
  MapPin, Maximize, BedDouble,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { MIN_ENTRY_PCT } from "@/lib/investmentTiers";
import { trackCtaClick } from "@/lib/analytics";
import { getAmenityIcon } from "@/lib/icons";
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
  limit?: number;
  seeAllHref?: string;
};

export default function CatalogSection({ developments, units, isInvestor, hasPhone = true, myInvestedUnitIds = [], isAuthenticated = false, myFavoriteUnitIds = [], lang, limit, seeAllHref }: Props) {
  const [drawerUnit, setDrawerUnit] = useState<Unit | null>(null);

  const visibleUnits = limit != null ? units.slice(0, limit) : units;
  const hasMore = limit != null && units.length > limit;
  const drawerDev = drawerUnit ? developments.find((d) => d.id === drawerUnit.development_id) : null;

  return (
    <section style={section}>
      <style>{`
        @media (max-width: 760px) {
          .unit-grid {
            display: flex !important;
            flex-direction: column;
            gap: 1.25rem;
          }
        }
      `}</style>
      <div style={inner}>

        <div style={sectionHeader}>
          <h3 style={sectionTitle}>Todas las propiedades</h3>
          <p style={sectionSub}>
            {units.length} unidad{units.length !== 1 ? "es" : ""} disponible{units.length !== 1 ? "s" : ""} en total.
          </p>
        </div>

        {isInvestor && units.length > 0 && (
          <p style={investorHint}>
            Como inversor podés adquirir entre el 5% y el 100% de cada departamento.
            Seleccioná uno para calcular tu inversión.
          </p>
        )}

        {visibleUnits.length === 0 ? (
          <p style={emptyMsg}>No hay unidades disponibles en este momento.</p>
        ) : (
          <div style={unitGrid} className="unit-grid">
            {visibleUnits.map((u, i) => (
              <div key={u.id} className="unit-card-item">
                <UnitCard
                  u={u}
                  devAddress={developments.find((d) => d.id === u.development_id)?.address ?? ""}
                  devSlug={developments.find((d) => d.id === u.development_id)?.slug ?? u.development_id}
                  devAmenities={developments.find((d) => d.id === u.development_id)?.amenities ?? []}
                  isInvestor={isInvestor}
                  alreadyInvested={myInvestedUnitIds.includes(u.id)}
                  onInvest={() => setDrawerUnit(u)}
                  lang={lang}
                  isAuthenticated={isAuthenticated}
                  isFavorited={myFavoriteUnitIds.includes(u.id)}
                  priority={i < 4}
                />
              </div>
            ))}
          </div>
        )}

        {hasMore && seeAllHref && (
          <div style={seeAllRow}>
            <Link href={seeAllHref} style={seeAllBtn}>
              Ver más propiedades →
            </Link>
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
  u, devAddress, devSlug, devAmenities, isInvestor, alreadyInvested, onInvest, lang, isAuthenticated, isFavorited, priority,
}: {
  u: Unit; devAddress: string; devSlug: string | number; devAmenities: string[]; isInvestor: boolean;
  alreadyInvested: boolean; onInvest: () => void; lang: string;
  isAuthenticated: boolean; isFavorited: boolean; priority?: boolean;
}) {
  const canBuy = isInvestor && u.status !== "sold" && !alreadyInvested;

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
          devAddress={devAddress}
          totalM2={u.total_m2}
          rooms={u.rooms}
          bedrooms={u.bedrooms}
          amenities={devAmenities}
          yieldInfo={hasCurrent ? { positive, gain } : null}
          unitId={u.id}
          isFavorited={isFavorited}
          isAuthenticated={isAuthenticated}
          lang={lang}
          entryPrice={entryPrice}
          minInvest={minInvest}
          canBuy={canBuy}
          alreadyInvested={alreadyInvested}
          fmtUsd={fmtUsd}
          priority={priority}
          onInvest={() => {
            trackCtaClick("catalog_invest_button", { label: u.identifier, location: "catalog" });
            onInvest();
          }}
        />
      </Link>
    </div>
  );
}

/* ─── Unit cover slider ──────────────────────────── */
function UnitCoverSlider({
  images, identifier, devAddress, totalM2, rooms, bedrooms, amenities, yieldInfo,
  unitId, isFavorited, isAuthenticated, lang, entryPrice, minInvest, canBuy, alreadyInvested, fmtUsd, priority, onInvest,
}: {
  images: string[] | undefined;
  identifier: string;
  devAddress: string;
  totalM2?: number | null;
  rooms?: number | null;
  bedrooms?: number | null;
  amenities: string[];
  yieldInfo: { positive: boolean; gain: number } | null;
  unitId: number;
  isFavorited: boolean;
  isAuthenticated: boolean;
  lang: string;
  entryPrice: number | null;
  minInvest: number | null;
  canBuy: boolean;
  alreadyInvested: boolean;
  fmtUsd: (n: number) => string;
  priority?: boolean;
  onInvest: () => void;
}) {
  const router = useRouter();
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
        <Image src={list[index]} alt={identifier} fill style={{ objectFit: "cover" }} sizes="(max-width: 760px) 84vw, 300px" priority={priority} />
      ) : (
        <div style={unitPlaceholder}>
          <Image src="/iad-logo.svg" alt="" width={202} height={109} unoptimized style={logoPlaceholderImg} />
        </div>
      )}
      <div style={unitGradient} />

      {minInvest != null && (
        <div style={investPill}>
          <span style={investPillLabel}>Invertí desde</span>
          <span style={investPillValue}>{fmtUsd(minInvest)}</span>
        </div>
      )}

      <div style={topRightRow}>
        <FavoriteButton
          unitId={unitId}
          initialFavorited={isFavorited}
          isAuthenticated={isAuthenticated}
          lang={lang}
          label={identifier}
          location="catalog"
          variant="hero"
        />
      </div>

      {hasMultiple && (
        <>
          <button type="button" style={{ ...sliderArrow, left: 10 }} onClick={(e) => go(-1, e)} aria-label="Foto anterior">
            <ChevronLeft size={16} />
          </button>
          <button type="button" style={{ ...sliderArrow, right: 10 }} onClick={(e) => go(1, e)} aria-label="Foto siguiente">
            <ChevronRight size={16} />
          </button>
        </>
      )}

      <div style={unitOverlay}>
        <div style={unitOverlayAddr}>
          <MapPin size={12} />
          <span style={unitOverlayAddrText}>{devAddress.toUpperCase()}</span>
        </div>

        <div style={unitOverlayStatRow}>
          {totalM2 != null && (
            <span style={unitOverlayStatChip}><Maximize size={11} /> {totalM2.toLocaleString("es-AR", { minimumFractionDigits: 2 })} m²</span>
          )}
          {rooms != null && <span style={unitOverlayStatChip}><BedDouble size={11} /> {rooms} amb.</span>}
          {bedrooms != null && <span style={unitOverlayStatChip}>{bedrooms} dorm.</span>}
        </div>

        {amenities.length > 0 && (
          <div style={unitAmenityRow}>
            {amenities.slice(0, 3).map((a) => {
              const Icon = getAmenityIcon(a);
              return (
                <div key={a} style={unitAmenityItem}>
                  <div style={unitAmenityCircle}><Icon size={15} /></div>
                  <span style={unitAmenityLabel}>{a}</span>
                </div>
              );
            })}
            {amenities.length > 3 && (
              <div style={unitAmenityItem}>
                <div style={unitAmenityCircle}>···</div>
                <span style={unitAmenityLabel}>Más</span>
              </div>
            )}
          </div>
        )}

        {yieldInfo && (
          <span style={{ ...unitYieldChip, background: yieldInfo.positive ? "rgba(70,211,154,0.22)" : "rgba(252,165,165,0.25)", color: yieldInfo.positive ? "#8fe9c4" : "#fecaca" }}>
            {yieldInfo.positive ? "▲" : "▼"} {Math.abs(yieldInfo.gain).toFixed(1)}% sobre el valor original
          </span>
        )}

        {entryPrice != null && (
          <div style={unitPriceBox}>
            <div>
              <span style={unitPriceBoxLabel}>VALOR DE LA UNIDAD</span>
              <div style={unitPriceBoxValue}>{fmtUsd(entryPrice)}</div>
            </div>
            {canBuy ? (
              <button
                type="button"
                style={unitInvestBtn}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInvest(); }}
              >
                Invertir →
              </button>
            ) : alreadyInvested ? (
              <button
                type="button"
                style={unitAlreadyBtn}
                onClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  trackCtaClick("catalog_already_invested", { label: identifier, location: "catalog" });
                  router.push(`/${lang}/wallet`);
                }}
              >
                Ya invertido →
              </button>
            ) : null}
          </div>
        )}

        {hasMultiple && (
          <div style={sliderDots}>
            {list.map((_, i) => (
              <span key={i} style={sliderDot(i === index)} />
            ))}
          </div>
        )}
      </div>
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

const sectionHeader: React.CSSProperties = { textAlign: "center", marginBottom: "1.75rem" };
const sectionTitle: React.CSSProperties = { fontSize: "2.1rem", fontWeight: 800, color: "var(--c-ink)", margin: "0 0 0.5rem", letterSpacing: "-0.02em" };
const sectionSub: React.CSSProperties = { fontSize: "1rem", color: "var(--c-text-secondary)", margin: 0 };

const seeAllRow: React.CSSProperties = { display: "flex", justifyContent: "center", marginTop: "2.5rem" };
const seeAllBtn: React.CSSProperties = {
  padding: "0.85rem 1.75rem", background: "var(--c-ink)", color: "#fff",
  borderRadius: 999, fontWeight: 700, fontSize: "0.92rem", textDecoration: "none",
};

const investorHint: React.CSSProperties = {
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
  padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#92400e",
  marginBottom: "1.25rem",
};

const unitLink: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" };

/* Unit card */
const unitGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))", gap: "1.5rem" };
const unitCard: React.CSSProperties = { display: "flex", flexDirection: "column" };
const unitCover: React.CSSProperties = {
  position: "relative", height: 487, borderRadius: 20, overflow: "hidden",
  background: "linear-gradient(135deg, #e8eef7, #dfe7f2)",
  border: "1px solid var(--c-border)",
  boxShadow: "0 20px 40px -20px rgba(14,23,38,0.35)",
};
const unitPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#e8eef7,#dfe7f2)" };
const logoPlaceholderImg: React.CSSProperties = { width: 68, height: "auto", opacity: 0.28, filter: "grayscale(1)" };
const unitGradient: React.CSSProperties = {
  position: "absolute", inset: 0,
  background: "linear-gradient(to top, rgba(9,13,23,0.92) 0%, rgba(9,13,23,0.55) 42%, rgba(9,13,23,0) 68%)",
};
const topRightRow: React.CSSProperties = { position: "absolute", top: 10, right: 10, zIndex: 2, display: "flex", alignItems: "center", gap: "0.4rem" };

const investPill: React.CSSProperties = {
  position: "absolute", top: "1rem", left: "1rem", zIndex: 2,
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
  background: "#fff", borderRadius: 16, padding: "0.6rem 1rem",
  boxShadow: "0 8px 20px -6px rgba(14,23,38,0.35)",
};
const investPillLabel: React.CSSProperties = { fontSize: "0.78rem", color: "var(--c-text-tertiary)", fontWeight: 600 };
const investPillValue: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800,
  color: "var(--c-positive)", letterSpacing: "-0.02em",
};

const unitOverlay: React.CSSProperties = {
  position: "absolute", left: 0, right: 0, bottom: 0, padding: "1rem 1.1rem",
  display: "flex", flexDirection: "column", gap: "0.4rem", zIndex: 1,
};
const unitOverlayAddr: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.75)" };
const unitOverlayAddrText: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const unitOverlayStatRow: React.CSSProperties = { display: "flex", gap: "0.4rem", flexWrap: "wrap" };
const unitOverlayStatChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: "0.8rem", fontWeight: 600,
  padding: "0.3rem 0.6rem", borderRadius: 999, backdropFilter: "blur(4px)",
};
const unitAmenityRow: React.CSSProperties = { display: "flex", gap: "0.6rem", marginTop: "0.1rem" };
const unitAmenityItem: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", width: 52 };
const unitAmenityCircle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
  fontSize: "0.85rem", fontWeight: 700, letterSpacing: "-0.05em",
};
const unitAmenityLabel: React.CSSProperties = {
  fontSize: "0.64rem", color: "rgba(255,255,255,0.8)", fontWeight: 500, textAlign: "center",
  lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 52,
};
const unitYieldChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "0.2rem 0.55rem",
  fontSize: "0.68rem", fontWeight: 700, marginTop: "0.15rem", backdropFilter: "blur(4px)", width: "fit-content",
};

const unitPriceBox: React.CSSProperties = {
  display: "flex", alignSelf: "flex-start", alignItems: "center", justifyContent: "space-between", gap: "0.85rem",
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 14, padding: "0.65rem 0.9rem", backdropFilter: "blur(6px)",
  boxShadow: "0px 2px 2px rgba(0,0,0,0.25)", marginTop: "0.5rem",
};
const unitPriceBoxLabel: React.CSSProperties = {
  fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em",
  textShadow: "0px 2px 2px rgba(0,0,0,0.25)", display: "block", whiteSpace: "nowrap",
};
const unitPriceBoxValue: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800, color: "#fff",
  letterSpacing: "-0.02em", lineHeight: 1.2, textShadow: "0px 2px 2px rgba(0,0,0,0.25)", whiteSpace: "nowrap",
};
const unitInvestBtn: React.CSSProperties = {
  padding: "0.5rem 0.8rem", background: "#fff", color: "var(--c-accent)",
  border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
  whiteSpace: "nowrap", flexShrink: 0,
};
const unitAlreadyBtn: React.CSSProperties = {
  padding: "0.5rem 0.8rem", background: "rgba(70,211,154,0.9)", color: "#06281c",
  border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
  whiteSpace: "nowrap", flexShrink: 0,
};
const sliderArrow: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  width: 26, height: 26, borderRadius: "50%", border: "none", cursor: "pointer",
  background: "rgba(0,0,0,0.45)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
};
const sliderDots: React.CSSProperties = {
  display: "flex", justifyContent: "center", gap: "0.35rem",
  marginTop: "0.6rem", marginBottom: "0.15rem",
};
const sliderDot = (active: boolean): React.CSSProperties => ({
  width: 5, height: 5, borderRadius: "50%",
  background: active ? "#fff" : "rgba(255,255,255,0.5)",
});
