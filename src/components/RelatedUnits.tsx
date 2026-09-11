"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Maximize, BedDouble } from "lucide-react";
import { MIN_ENTRY_PCT } from "@/lib/investmentTiers";
import { getAmenityIcon } from "@/lib/icons";

export type RelatedUnit = {
  id: number;
  identifier: string;
  price_usd: number | null;
  total_m2?: number | null;
  rooms?: number | null;
  images: string[];
  status: string;
  dev_address: string;
  dev_slug: string | number;
  dev_amenities: string[];
};

type Props = {
  units: RelatedUnit[];
  lang: string;
};

const DESKTOP_COUNT = 4;

export default function RelatedUnits({ units, lang }: Props) {
  if (units.length === 0) return null;

  const desktopUnits = units.slice(0, DESKTOP_COUNT);

  return (
    <section style={section}>
      <style>{`
        @media (max-width: 760px) {
          .related-units-grid { display: none !important; }
        }
        @media (min-width: 761px) {
          .related-units-track { display: none !important; }
        }
        .related-units-track::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={inner}>
        <div style={header}>
          <p style={subtitle}>Seguí explorando otras oportunidades de inversión.</p>
        </div>

        <div style={grid} className="related-units-grid">
          {desktopUnits.map((u) => (
            <RelatedUnitCard key={u.id} u={u} lang={lang} />
          ))}
        </div>

        <div style={track} className="related-units-track">
          {units.map((u) => (
            <div key={u.id} style={trackItem}>
              <RelatedUnitCard u={u} lang={lang} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedUnitCard({ u, lang }: { u: RelatedUnit; lang: string }) {
  const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;
  const minInvest = u.price_usd != null ? Math.round(Number(u.price_usd) * MIN_ENTRY_PCT) : null;
  const amenities = u.dev_amenities ?? [];

  return (
    <Link href={`/${lang}/developments/${u.dev_slug}/units/${u.id}`} style={cardLink}>
      <div style={imageWrap}>
        {u.images?.[0] ? (
          <Image
            src={u.images[0]}
            alt={u.identifier}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 760px) 78vw, 300px"
          />
        ) : (
          <div style={imagePlaceholder} />
        )}
        <div style={gradient} />

        {minInvest != null && (
          <div style={investPill}>
            <span style={investPillLabel}>Invertí desde</span>
            <span style={investPillValue}>{fmtUsd(minInvest)}</span>
          </div>
        )}

        {u.status === "sold" && <span style={soldPill}>Vendida</span>}

        <div style={overlay}>
          <div style={addrRow}>
            <MapPin size={12} />
            <span style={addrText}>{u.dev_address.toUpperCase()}</span>
          </div>

          <div style={statRow}>
            {u.total_m2 != null && (
              <span style={statChip}>
                <Maximize size={11} /> {Number(u.total_m2).toLocaleString("es-AR", { minimumFractionDigits: 2 })} m²
              </span>
            )}
            {u.rooms != null && (
              <span style={statChip}>
                <BedDouble size={11} /> {u.rooms} amb.
              </span>
            )}
          </div>

          {amenities.length > 0 && (
            <div style={amenityRow}>
              {amenities.slice(0, 3).map((a) => {
                const Icon = getAmenityIcon(a);
                return (
                  <div key={a} style={amenityItem}>
                    <div style={amenityCircle}>
                      <Icon size={14} />
                    </div>
                    <span style={amenityLabel}>{a}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Styles ────────────────────────────────────── */
const section: React.CSSProperties = { background: "var(--c-bg)", padding: "3rem 1.5rem 4rem" };
const inner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

const header: React.CSSProperties = { textAlign: "center", marginBottom: "1.75rem" };
const subtitle: React.CSSProperties = { fontSize: "1.125rem", color: "var(--c-text-secondary)", margin: 0 };

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" };

const track: React.CSSProperties = {
  display: "flex", gap: "1.25rem", overflowX: "auto",
  scrollSnapType: "x mandatory", scrollbarWidth: "none",
  paddingBottom: "0.25rem",
};
const trackItem: React.CSSProperties = { flex: "0 0 auto", width: "78vw", maxWidth: 340, scrollSnapAlign: "start" };

const cardLink: React.CSSProperties = { textDecoration: "none", color: "inherit", display: "block" };
const imageWrap: React.CSSProperties = {
  position: "relative", aspectRatio: "3 / 4.3", borderRadius: 20, overflow: "hidden",
  background: "linear-gradient(135deg, #e8eef7, #dfe7f2)",
  border: "1px solid var(--c-border)",
  boxShadow: "0 20px 40px -20px rgba(14,23,38,0.35)",
};
const imagePlaceholder: React.CSSProperties = { width: "100%", height: "100%", background: "linear-gradient(135deg,#e8eef7,#dfe7f2)" };
const gradient: React.CSSProperties = {
  position: "absolute", inset: 0,
  background: "linear-gradient(to top, rgba(9,13,23,0.92) 0%, rgba(9,13,23,0.55) 42%, rgba(9,13,23,0) 68%)",
};

const investPill: React.CSSProperties = {
  position: "absolute", top: "1rem", left: "1rem", zIndex: 2,
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
  background: "#fff", borderRadius: 16, padding: "0.6rem 1rem",
  boxShadow: "0 8px 20px -6px rgba(14,23,38,0.35)",
};
const investPillLabel: React.CSSProperties = { fontSize: "0.78rem", color: "var(--c-text-tertiary)", fontWeight: 600 };
const investPillValue: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 800,
  color: "var(--c-positive)", letterSpacing: "-0.02em",
};

const soldPill: React.CSSProperties = {
  position: "absolute", top: "1rem", right: "1rem", zIndex: 2,
  background: "#fee2e2", color: "#991b1b", borderRadius: 999,
  padding: "0.3rem 0.75rem", fontSize: "0.72rem", fontWeight: 700,
};

const overlay: React.CSSProperties = {
  position: "absolute", left: 0, right: 0, bottom: 0, padding: "1rem 1.1rem",
  display: "flex", flexDirection: "column", gap: "0.4rem", zIndex: 1,
};
const addrRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.75)" };
const addrText: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const statRow: React.CSSProperties = { display: "flex", gap: "0.4rem", flexWrap: "wrap" };
const statChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: "0.8rem", fontWeight: 600,
  padding: "0.3rem 0.6rem", borderRadius: 999, backdropFilter: "blur(4px)",
};
const amenityRow: React.CSSProperties = { display: "flex", gap: "0.6rem", marginTop: "0.1rem" };
const amenityItem: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", width: 52 };
const amenityCircle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
};
const amenityLabel: React.CSSProperties = {
  fontSize: "0.64rem", color: "rgba(255,255,255,0.8)", fontWeight: 500, textAlign: "center",
  lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 52,
};
