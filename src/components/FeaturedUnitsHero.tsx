"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Maximize, BedDouble } from "lucide-react";
import { getAmenityIcon } from "@/lib/icons";

export type FeaturedUnit = {
  id: number;
  identifier: string;
  images: string[];
  price_usd: number;
  total_m2: number | null;
  rooms: number | null;
  development_name: string;
  development_address: string;
  development_slug: string | null;
  development_id: number;
  amenities: string[];
};

type Props = { units: FeaturedUnit[]; lang: string };

const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

export default function FeaturedUnitsHero({ units, lang }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild instanceof HTMLElement ? el.firstElementChild.offsetWidth : 320;
    el.scrollBy({ left: dir * (cardWidth + 20), behavior: "smooth" });
  }

  if (units.length === 0) return null;

  return (
    <section style={section}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .featured-units-track::-webkit-scrollbar { display: none; }
        @media (max-width: 760px) {
          .featured-units-card { width: 78vw !important; }
          .featured-units-nav { display: none !important; }
        }
      `,
        }}
      />
      <div style={header}>
        <div>
          <h2 style={title}>Unidades destacadas</h2>
          <p style={sub}>Una selección de oportunidades listas para invertir</p>
        </div>
        <div style={nav} className="featured-units-nav">
          <button type="button" style={navBtn} onClick={() => scrollBy(-1)} aria-label="Anterior">
            <ChevronLeft size={18} />
          </button>
          <button type="button" style={navBtn} onClick={() => scrollBy(1)} aria-label="Siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div style={track} className="featured-units-track" ref={trackRef}>
        {units.map((u) => (
          <Link
            key={u.id}
            href={`/${lang}/developments/${u.development_slug ?? u.development_id}/units/${u.id}`}
            style={card}
            className="featured-units-card"
          >
            <div style={imageWrap}>
              {u.images[0] ? (
                <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} sizes="(max-width: 760px) 78vw, 320px" />
              ) : (
                <div style={imagePlaceholder} />
              )}
              <div style={gradient} />

              <div style={overlay}>
                <div style={overlayAddr}>
                  <MapPin size={12} />
                  <span style={overlayAddrText}>{u.development_address}</span>
                </div>

                <div style={statRow}>
                  {u.total_m2 != null && (
                    <span style={statChip}><Maximize size={12} /> {Number(u.total_m2)} m²</span>
                  )}
                  {u.rooms != null && (
                    <span style={statChip}><BedDouble size={12} /> {u.rooms} amb.</span>
                  )}
                </div>

                {u.amenities.length > 0 && (
                  <div style={amenityRow}>
                    {u.amenities.slice(0, 4).map((a) => {
                      const Icon = getAmenityIcon(a);
                      return (
                        <div key={a} style={amenityItem}>
                          <div style={amenityCircle}><Icon size={14} /></div>
                          <span style={amenityLabel}>{a}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={priceRow}>
                  <span style={priceLabel}>Invertí desde</span>
                  <span style={priceValue}>{fmtUsd(u.price_usd * 0.05)}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const section: React.CSSProperties = { padding: "1.5rem 0 4rem" };
const header: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem",
  display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1.5rem",
  marginBottom: "1.75rem", flexWrap: "wrap",
};
const title: React.CSSProperties = { fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 0.5rem", color: "var(--c-ink)" };
const sub: React.CSSProperties = { fontSize: "1rem", color: "var(--c-text-secondary)", margin: 0 };
const nav: React.CSSProperties = { display: "flex", gap: "0.5rem" };
const navBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--c-border)",
  background: "var(--c-surface)", color: "var(--c-ink)", display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer",
};

const track: React.CSSProperties = {
  display: "flex", gap: "1.25rem", overflowX: "auto",
  scrollSnapType: "x mandatory", padding: "0 1.5rem",
  maxWidth: 1200, margin: "0 auto",
  scrollbarWidth: "none",
};

const card: React.CSSProperties = {
  flex: "0 0 auto", width: 320, scrollSnapAlign: "start",
  textDecoration: "none", display: "block",
};

const imageWrap: React.CSSProperties = {
  position: "relative", width: "100%", aspectRatio: "3 / 4", borderRadius: 20, overflow: "hidden",
  background: "linear-gradient(135deg, #e8eef7, #dfe7f2)",
  boxShadow: "0 20px 40px -20px rgba(14,23,38,0.35)",
};
const imagePlaceholder: React.CSSProperties = { position: "absolute", inset: 0 };
const gradient: React.CSSProperties = {
  position: "absolute", inset: 0,
  background: "linear-gradient(to top, rgba(9,13,23,0.92) 0%, rgba(9,13,23,0.55) 42%, rgba(9,13,23,0) 68%)",
};

const overlay: React.CSSProperties = {
  position: "absolute", left: 0, right: 0, bottom: 0, padding: "1.25rem",
  display: "flex", flexDirection: "column", gap: "0.5rem",
};
const overlayAddr: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.3rem", color: "rgba(255,255,255,0.7)" };
const overlayAddrText: React.CSSProperties = { fontSize: "0.75rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const statRow: React.CSSProperties = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };
const statChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.75rem", fontWeight: 600,
  padding: "0.3rem 0.6rem", borderRadius: 999, backdropFilter: "blur(4px)",
};

const amenityRow: React.CSSProperties = { display: "flex", gap: "0.6rem", marginTop: "0.1rem" };
const amenityItem: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", width: 52 };
const amenityCircle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.55)",
  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
};
const amenityLabel: React.CSSProperties = {
  fontSize: "0.62rem", color: "rgba(255,255,255,0.8)", fontWeight: 500, textAlign: "center",
  lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 52,
};

const priceRow: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.25rem" };
const priceLabel: React.CSSProperties = { fontSize: "0.78rem", color: "rgba(255,255,255,0.65)", fontWeight: 500 };
const priceValue: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" };
