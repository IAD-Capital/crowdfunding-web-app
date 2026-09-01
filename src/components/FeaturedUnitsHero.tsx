"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Maximize, BedDouble } from "lucide-react";
import { getAmenityIcon } from "@/lib/icons";
import { trackCtaClick } from "@/lib/analytics";

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

type Props = {
  units: FeaturedUnit[]; lang: string; minInvestUsd: number | null;
  totalUnitsCount: number; hasSession: boolean; isInvestor: boolean; fullName?: string | null;
};

const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

const fmtUsdPerM2 = (priceUsd: number, totalM2: number) => `${fmtUsd(priceUsd / totalM2)}/m²`;

export default function FeaturedUnitsHero({ units, lang, minInvestUsd, totalUnitsCount, hasSession, isInvestor, fullName }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild instanceof HTMLElement ? el.firstElementChild.offsetWidth : 340;
    el.scrollBy({ left: dir * (cardWidth + 20), behavior: "smooth" });
  }

  if (units.length === 0) return null;

  return (
    <section style={section}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .featured-units-track::-webkit-scrollbar { display: none; }
        @keyframes investPillIn {
          0% { opacity: 0; transform: translateY(-14px) scale(0.9); }
          60% { opacity: 1; transform: translateY(2px) scale(1.04); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes investPillPulse {
          0%, 100% { box-shadow: 0 8px 20px -6px rgba(14,23,38,0.35), 0 0 0 0 rgba(14,159,110,0.28); }
          50% { box-shadow: 0 8px 20px -6px rgba(14,23,38,0.35), 0 0 0 7px rgba(14,159,110,0); }
        }
        .invest-pill {
          animation: investPillIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both,
                     investPillPulse 2.6s ease-in-out 0.9s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .invest-pill { animation: none !important; }
        }
        @media (max-width: 760px) {
          .featured-units-card { width: 78vw !important; }
          .featured-units-nav { display: none !important; }
        }
        @media (min-width: 861px) {
          .featured-hero-layout {
            display: grid !important; grid-template-columns: minmax(340px, 460px) 1fr !important;
            align-items: start !important; gap: 2.5rem !important;
            max-width: none !important;
            padding-left: max(1.5rem, calc((100vw - 1200px) / 2 + 1.5rem)) !important;
            padding-right: 0 !important;
          }
        }
      `,
        }}
      />
      <div style={layoutWrap} className="featured-hero-layout">
        <div style={headerText}>
          {isInvestor ? (
            <span style={badge}>
              <span style={badgeDot} />
              Bienvenido, {fullName}
            </span>
          ) : (
            <span style={badge}>
              <span style={badgeDot} />
              {totalUnitsCount} departamento{totalUnitsCount !== 1 ? "s" : ""} activo{totalUnitsCount !== 1 ? "s" : ""} · invertí desde el 5%
            </span>
          )}
          <h2 style={title}>
            {minInvestUsd != null ? (
              <>Comprá una propiedad desde <span style={titleHighlight}>{fmtUsd(minInvestUsd)}</span></>
            ) : (
              "Unidades destacadas"
            )}
          </h2>
          <p style={sub}>
            Accedé a los mejores departamentos inmobiliarios y comprá desde un{" "}
            <strong style={{ color: "var(--c-ink)" }}>5%</strong> de una unidad funcional. Simple, seguro y rentable.
          </p>
          <div style={cta}>
            {!hasSession ? (
              <>
                <Link
                  href={`/${lang}/signup`}
                  style={btnPrimary}
                  onClick={() => trackCtaClick("hero_signup", { label: "Empezar a invertir", location: "home_hero" })}
                >
                  Empezar a invertir
                </Link>
                <Link
                  href={`/${lang}/login`}
                  style={btnOutline}
                  onClick={() => trackCtaClick("hero_login", { label: "Iniciar sesión", location: "home_hero" })}
                >
                  Iniciar sesión
                </Link>
              </>
            ) : isInvestor ? (
              <a
                href="#catalog"
                style={btnPrimary}
                onClick={() => trackCtaClick("hero_view_opportunities", { label: "Ver oportunidades", location: "home_hero" })}
              >
                Ver oportunidades
              </a>
            ) : null}
          </div>
          <div style={trust}>
            <span style={trustItem}><span style={trustCheck}>✓</span>Escrituración legal</span>
            <span style={trustItem}><span style={trustCheck}>✓</span>Transparencia total</span>
          </div>
        </div>

        <div style={carouselCol}>
          <div style={track} className="featured-units-track" ref={trackRef}>
            {units.map((u, idx) => (
              <Link
                key={u.id}
                href={`/${lang}/developments/${u.development_slug ?? u.development_id}/units/${u.id}`}
                style={card}
                className="featured-units-card"
                onClick={() => trackCtaClick("hero_featured_unit", { label: u.identifier, location: "home_hero_carousel" })}
              >
                <div style={imageWrap}>
                  {u.images[0] ? (
                    <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} sizes="(max-width: 760px) 78vw, 340px" priority={idx === 0} />
                  ) : (
                    <div style={imagePlaceholder} />
                  )}
                  <div style={gradient} />

                  <div style={{ ...investPill, animationDelay: `${idx * 0.1}s, ${0.9 + idx * 0.1}s` }} className="invest-pill">
                    <span style={investPillLabel}>Invertí desde</span>
                    <span style={investPillValue}>{fmtUsd(u.price_usd * 0.05)}</span>
                  </div>

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

                    {u.total_m2 != null && (
                      <div style={valorM2Box}>
                        <span style={valorM2Label}>VALOR M²</span>
                        <span style={valorM2Value}>{fmtUsdPerM2(u.price_usd, Number(u.total_m2))}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
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
      </div>
    </section>
  );
}

const section: React.CSSProperties = { padding: "1.5rem 0 4rem" };
const layoutWrap: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem",
  display: "flex", flexDirection: "column", gap: "1.75rem",
};
const headerText: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.9rem", maxWidth: 640 };
const carouselCol: React.CSSProperties = { minWidth: 0 };
const badge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.5rem", width: "fit-content",
  background: "var(--c-positive-light)", color: "var(--c-positive)", borderRadius: 999,
  padding: "0.45rem 0.85rem", fontSize: "0.8rem", fontWeight: 600,
};
const badgeDot: React.CSSProperties = { width: 7, height: 7, borderRadius: "50%", background: "var(--c-positive)", display: "inline-block" };
const title: React.CSSProperties = {
  fontSize: "clamp(2.1rem, 4.5vw, 3.4rem)", fontWeight: 800,
  lineHeight: 1.06, letterSpacing: "-0.035em", margin: 0, color: "var(--c-ink)",
};
const titleHighlight: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", fontFamily: "var(--font-display)",
  background: "rgba(27,77,224,0.08)", border: "1px solid rgba(27,77,224,0.16)",
  backdropFilter: "blur(6px)", borderRadius: "0.22em", padding: "0 0.22em",
  boxShadow: "0 6px 14px -10px rgba(27,77,224,0.35)", color: "var(--c-accent)",
};
const sub: React.CSSProperties = { fontSize: "1.1rem", color: "var(--c-text-secondary)", lineHeight: 1.55, margin: 0 };
const cta: React.CSSProperties = { display: "flex", gap: "0.85rem", flexWrap: "wrap" };
const btnPrimary: React.CSSProperties = {
  padding: "0.9rem 1.6rem", background: "var(--c-accent)", color: "#fff",
  borderRadius: 11, textDecoration: "none", fontWeight: 600, fontSize: "0.98rem",
  boxShadow: "0 10px 24px rgba(27,77,224,0.26)",
};
const btnOutline: React.CSSProperties = {
  padding: "0.9rem 1.6rem", background: "var(--c-surface)", color: "var(--c-ink)",
  border: "1px solid var(--c-border-input)", borderRadius: 11,
  textDecoration: "none", fontWeight: 600, fontSize: "0.98rem",
};
const trust: React.CSSProperties = { display: "flex", alignItems: "center", gap: "1.1rem", flexWrap: "wrap", color: "var(--c-text-tertiary)", fontSize: "0.85rem", fontWeight: 500 };
const trustItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.5rem" };
const trustCheck: React.CSSProperties = {
  width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--c-positive)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "var(--c-positive)", fontSize: "0.65rem", fontWeight: 800,
};
const nav: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.85rem" };
const navBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--c-border)",
  background: "var(--c-surface)", color: "var(--c-ink)", display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer",
};

const track: React.CSSProperties = {
  display: "flex", gap: "1.25rem", overflowX: "auto",
  scrollSnapType: "x mandatory", width: "100%",
  scrollbarWidth: "none",
};

const card: React.CSSProperties = {
  flex: "0 0 auto", width: 340, scrollSnapAlign: "start",
  textDecoration: "none", display: "block",
};

const imageWrap: React.CSSProperties = {
  position: "relative", width: "100%", aspectRatio: "3 / 4.3", borderRadius: 20, overflow: "hidden",
  background: "linear-gradient(135deg, #e8eef7, #dfe7f2)",
  border: "1px solid var(--c-border)",
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

const investPill: React.CSSProperties = {
  position: "absolute", top: "1rem", right: "1rem", zIndex: 2,
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.15rem",
  background: "#fff", borderRadius: 16, padding: "0.6rem 1rem",
  boxShadow: "0 8px 20px -6px rgba(14,23,38,0.35)",
};
const investPillLabel: React.CSSProperties = { fontSize: "0.72rem", color: "var(--c-text-tertiary)", fontWeight: 600 };
const investPillValue: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800,
  color: "var(--c-positive)", letterSpacing: "-0.02em",
};

const valorM2Box: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem",
  alignSelf: "flex-start", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 14, padding: "0.6rem 1rem", backdropFilter: "blur(6px)",
  boxShadow: "0px 2px 2px rgba(0,0,0,0.25)", marginTop: "0.65rem",
};
const valorM2Value: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 800, color: "#fff",
  letterSpacing: "-0.02em", lineHeight: 1, textShadow: "0px 2px 2px rgba(0,0,0,0.25)",
};
const valorM2Label: React.CSSProperties = {
  fontSize: "0.65rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em",
  textShadow: "0px 2px 2px rgba(0,0,0,0.25)",
};
