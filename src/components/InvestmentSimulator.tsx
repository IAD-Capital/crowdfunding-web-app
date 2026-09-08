"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Check, MapPin, Maximize, BedDouble } from "lucide-react";
import { MIN_ENTRY_PCT } from "@/lib/investmentTiers";
import { trackCtaClick } from "@/lib/analytics";

export type SimUnit = {
  id: number;
  identifier: string;
  images: string[];
  price_usd: number;
  total_m2: number | null;
  rooms: number | null;
  available_pct?: number;
  development_name: string;
  development_address: string;
  development_slug: string | null;
  development_id: number;
};

type Props = {
  units: SimUnit[];
  lang: string;
};

const MIN_PCT = MIN_ENTRY_PCT * 100;
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Slider steps: 5%, 10%, ... up to whatever's available (capped at 50%),
// then a final notch that jumps straight to 100% (a full-unit purchase).
function computeSteps(maxAvailablePct: number) {
  const sliderMax = Math.min(50, maxAvailablePct);
  const steps: number[] = [];
  if (sliderMax >= MIN_PCT) {
    for (let v = MIN_PCT; v <= sliderMax; v += 5) steps.push(v);
  } else if (sliderMax > 0) {
    steps.push(Math.round(sliderMax));
  }
  if (maxAvailablePct >= 100) steps.push(100);
  return steps;
}

export default function InvestmentSimulator({ units, lang }: Props) {
  const investable = useMemo(
    () => units.filter((u) => (u.available_pct ?? 100) > 0),
    [units]
  );

  const [selectedId, setSelectedId] = useState<number | "">(investable[0]?.id ?? "");
  const [stepIndex, setStepIndex] = useState(0);

  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    let raf = 0;
    function applyScale() {
      if (!strip) return;
      const rect = strip.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      cardRefs.current.forEach((el) => {
        const r = el.getBoundingClientRect();
        const cardCenter = r.left + r.width / 2;
        const dist = Math.abs(cardCenter - center);
        const ratio = Math.min(dist / (rect.width / 2 || 1), 1);
        const scale = 1.08 - ratio * 0.2;
        const opacity = Math.max(1 - ratio * 0.4, 0.55);
        el.style.transform = `scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(2);
        el.style.zIndex = ratio < 0.2 ? "2" : "1";
      });
    }
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(applyScale);
    }

    applyScale();
    strip.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      strip.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [investable.length]);

  const selectedUnit = investable.find((u) => u.id === selectedId) ?? null;
  const maxPct = selectedUnit ? Math.min(100, selectedUnit.available_pct ?? 100) : 100;
  const steps = useMemo(() => computeSteps(maxPct), [maxPct]);
  const clampedIndex = Math.min(stepIndex, Math.max(steps.length - 1, 0));
  const effectivePct = steps[clampedIndex] ?? 0;
  const price = selectedUnit?.price_usd ?? 0;
  const amount = price > 0 ? (price * effectivePct) / 100 : 0;
  const fillPct = steps.length > 1 ? (clampedIndex / (steps.length - 1)) * 100 : 100;

  const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;
  const fmtUsdPerM2 = (priceUsd: number, totalM2: number) => `${fmtUsd(priceUsd / totalM2)}/m²`;

  // Animate "Tu inversión" like the home page's stat counters: count from the
  // previous amount up (or down) to the new one instead of jumping instantly.
  const [displayAmount, setDisplayAmount] = useState(amount);
  const displayRef = useRef(amount);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      displayRef.current = amount;
      setDisplayAmount(amount);
      return;
    }
    const from = displayRef.current;
    const to = amount;
    if (from === to) return;
    const duration = 500;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = easeOutExpo(t);
      const current = from + (to - from) * eased;
      displayRef.current = current;
      setDisplayAmount(current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [amount]);

  function handleSelectUnit(u: SimUnit) {
    setSelectedId(u.id);
    setStepIndex(0);
  }

  function scrollCarousel(dir: 1 | -1) {
    const el = stripRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const cardWidth = first ? first.getBoundingClientRect().width : 130;
    el.scrollBy({ left: dir * (cardWidth + 14), behavior: "smooth" });
  }

  if (investable.length === 0) return null;

  return (
    <section style={section}>
      <style>{`
        @media (max-width: 860px) {
          .sim-inner { grid-template-columns: 1fr !important; }
          .sim-unit-card { width: 46vw !important; }
          .sim-carousel-nav { display: none !important; }
        }
        @media (min-width: 861px) {
          .sim-result-box { flex-direction: row !important; align-items: center !important; justify-content: space-between !important; }
        }
        .sim-unit-strip::-webkit-scrollbar { display: none; }
        @keyframes simValuePop {
          0% { opacity: 0.5; transform: translateY(4px) scale(0.96); }
          60% { opacity: 1; transform: translateY(-1px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sim-animated-value { animation: simValuePop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @media (prefers-reduced-motion: reduce) {
          .sim-animated-value { animation: none !important; }
        }
      `}</style>
      <div style={inner} className="sim-inner">
        <div style={copy}>
          <span style={eyebrow}>Simulá tu inversión</span>
          <h2 style={title}>Elegí una unidad y calculá tu entrada</h2>
          <p style={subtitle}>Elegí una de nuestras unidades destacadas y mirá al instante cuánto representa cada opción de inversión.</p>
          <ul style={perks}>
            <li style={perk}><span style={checkIcon}>✓</span>Sin mínimo de capital elevado</li>
            <li style={perk}><span style={checkIcon}>✓</span>Resultados claros antes de invertir</li>
            <li style={perk}><span style={checkIcon}>✓</span>Seguimiento en tiempo real de tu cartera</li>
          </ul>
        </div>

        <div style={card}>
          <label style={{ ...label, paddingLeft: "2.1rem" }}>Seleccioná la unidad</label>
          <div style={unitStrip} className="sim-unit-strip" ref={stripRef}>
            {investable.map((u) => {
              const active = u.id === selectedId;
              return (
                <button
                  key={u.id}
                  type="button"
                  className="sim-unit-card"
                  ref={(el) => {
                    if (el) cardRefs.current.set(u.id, el);
                    else cardRefs.current.delete(u.id);
                  }}
                  style={unitCard}
                  onClick={() => handleSelectUnit(u)}
                  aria-label={`Unidad en ${u.development_address}`}
                  aria-pressed={active}
                >
                  <div style={unitCardImageWrap(active)}>
                    {u.images[0] ? (
                      <Image src={u.images[0]} alt={u.development_address} fill style={{ objectFit: "cover" }} sizes="(max-width: 860px) 46vw, 150px" />
                    ) : (
                      <div style={unitCardImagePlaceholder} />
                    )}
                    <div style={unitCardGradient} />

                    <div style={unitCardInvestPill}>
                      <span style={unitCardInvestLabel}>Invertí desde</span>
                      <span style={unitCardInvestValue}>{fmtUsd(u.price_usd * MIN_ENTRY_PCT)}</span>
                    </div>

                    {active && (
                      <span style={unitCardCheckBadge}>
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}

                    <div style={unitCardOverlay}>
                      <div style={unitCardAddr}>
                        <MapPin size={9} />
                        <span style={unitCardAddrText}>{u.development_address}</span>
                      </div>

                      <div style={unitCardStatRow}>
                        {u.total_m2 != null && (
                          <span style={unitCardStatChip}><Maximize size={9} /> {Number(u.total_m2)} m²</span>
                        )}
                        {u.rooms != null && (
                          <span style={unitCardStatChip}><BedDouble size={9} /> {u.rooms} amb.</span>
                        )}
                      </div>

                      {u.total_m2 != null && (
                        <div style={unitCardValorM2Box}>
                          <span style={unitCardValorM2Label}>VALOR M²</span>
                          <span style={unitCardValorM2Value}>{fmtUsdPerM2(u.price_usd, Number(u.total_m2))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={carouselNav} className="sim-carousel-nav">
            <button type="button" style={navBtn} onClick={() => scrollCarousel(-1)} aria-label="Anterior">
              <ChevronLeft size={18} />
            </button>
            <button type="button" style={navBtn} onClick={() => scrollCarousel(1)} aria-label="Siguiente">
              <ChevronRight size={18} />
            </button>
          </div>

          <div style={resultBox} className="sim-result-box">
            <div>
              <div style={resultLabel}>Tu inversión</div>
              <div style={resultValue}>{fmtUsd(displayAmount)}</div>
            </div>
            {effectivePct !== 100 && selectedUnit && (
              <span style={totalValueLabel}>Valor total de la unidad {fmtUsd(price)}</span>
            )}
          </div>

          <div style={pctBlock}>
            <label style={{ ...label, marginBottom: 0 }}>Porcentaje de participación</label>

            <div style={pctReadout}>
              <span key={effectivePct} className="sim-animated-value" style={pctReadoutNum}>{effectivePct}</span>
              <span style={pctReadoutSym}>%</span>
            </div>

            <div style={sliderWrap}>
              <style>{`
                .sim-slider {
                  -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 999px;
                  background: linear-gradient(to right, var(--c-ink) ${fillPct}%, var(--c-border) ${fillPct}%);
                  cursor: pointer; outline: none;
                }
                .sim-slider::-webkit-slider-thumb {
                  -webkit-appearance: none; width: 24px; height: 24px; border-radius: 50%;
                  background: var(--c-ink); border: 3px solid var(--c-surface);
                  box-shadow: 0 2px 8px rgba(0,0,0,0.25); cursor: pointer;
                }
                .sim-slider::-moz-range-thumb {
                  width: 24px; height: 24px; border-radius: 50%;
                  background: var(--c-ink); border: 3px solid var(--c-surface);
                  box-shadow: 0 2px 8px rgba(0,0,0,0.25); cursor: pointer;
                }
                .sim-slider:disabled { opacity: 0.5; cursor: not-allowed; }
              `}</style>
              <input
                type="range"
                min={0}
                max={Math.max(steps.length - 1, 0)}
                step={1}
                value={clampedIndex}
                onChange={(e) => setStepIndex(Number(e.target.value))}
                className="sim-slider"
                disabled={steps.length <= 1}
              />
              <div style={sliderLabels}>
                <span>{steps[0] ?? 0}%</span>
                <span>{steps[steps.length - 1] ?? 0}%</span>
              </div>
            </div>
          </div>

          {selectedUnit && (
            <Link
              href={`/${lang}/developments/${selectedUnit.development_slug ?? selectedUnit.development_id}/units/${selectedUnit.id}`}
              style={ctaBtn}
              onClick={() => trackCtaClick("simulator_view_unit", { label: selectedUnit.identifier, location: "investment_simulator" })}
            >
              Ver unidad e invertir →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Styles ────────────────────────────────────── */
const section: React.CSSProperties = { background: "var(--c-bg)", padding: "5rem 1.5rem" };
const inner: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto",
  display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "3.5rem", alignItems: "center",
};
const copy: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 };
const eyebrow: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 700, color: "var(--c-accent)",
  letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem",
};
const title: React.CSSProperties = { fontSize: "2rem", fontWeight: 800, margin: "0 0 0.85rem", letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--c-ink)" };
const subtitle: React.CSSProperties = { fontSize: "1.02rem", color: "var(--c-text-secondary)", margin: "0 0 1.5rem", lineHeight: 1.55 };
const perks: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" };
const perk: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.95rem", color: "var(--c-ink)", fontWeight: 500 };
const checkIcon: React.CSSProperties = {
  width: 22, height: 22, borderRadius: "50%", background: "var(--c-positive-light)", color: "var(--c-positive)",
  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, flexShrink: 0,
};

const card: React.CSSProperties = {
  background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 22,
  padding: "2.1rem 0", display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0,
  // No overflow clipping here (setting just overflowY would force overflowX to "auto"
  // per spec, re-clipping horizontally). The unit strip below manages its own scroll
  // clipping — with side padding reserved for the selected card's focus ring — so an
  // ancestor overflow:hidden would just double-clip that ring at the edges.
  boxShadow: "0 30px 60px -30px rgba(14,23,38,0.28)",
};
const label: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 700, color: "var(--c-text-secondary)", marginBottom: "0.5rem" };

/* Unit strip — indented to match the label/nav rhythm above and below it, with enough
   side padding that the active card's focus ring and hover scale never get clipped. */
const unitStrip: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.7rem", overflowX: "auto", overflowY: "hidden",
  padding: "0.6rem 1.75rem 0.6rem 2.25rem", margin: "0.4rem 0 1.25rem", scrollbarWidth: "none",
  scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
};
const unitCard: React.CSSProperties = {
  flex: "0 0 auto", width: 150, display: "block",
  padding: "0.2rem", borderRadius: 16, border: "none", background: "transparent",
  cursor: "pointer", transition: "transform 0.15s ease, opacity 0.15s ease",
  fontFamily: "inherit", scrollSnapAlign: "center",
};
// Selection state lives on the image itself — a soft accent halo + check badge —
// instead of a hard border on the button, so nothing gets clipped by the scroller edge.
const unitCardImageWrap = (active: boolean): React.CSSProperties => ({
  position: "relative", width: "100%", aspectRatio: "3 / 4.1", borderRadius: 14, overflow: "hidden",
  background: "linear-gradient(135deg, #e8eef7, #dfe7f2)", flexShrink: 0,
  border: "1px solid var(--c-border)",
  boxShadow: active
    ? "0 0 0 2px var(--c-surface), 0 0 0 4px var(--c-accent), 0 10px 20px -12px rgba(27,77,224,0.45)"
    : "0 10px 20px -14px rgba(14,23,38,0.35)",
  transition: "box-shadow 0.15s ease",
});
const unitCardImagePlaceholder: React.CSSProperties = { position: "absolute", inset: 0 };
const unitCardGradient: React.CSSProperties = {
  position: "absolute", inset: 0,
  background: "linear-gradient(to top, rgba(9,13,23,0.92) 0%, rgba(9,13,23,0.55) 42%, rgba(9,13,23,0) 68%)",
};
const unitCardCheckBadge: React.CSSProperties = {
  position: "absolute", top: 7, left: 7, zIndex: 2, width: 17, height: 17, borderRadius: "50%",
  background: "var(--c-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 0 0 2px rgba(255,255,255,0.85)",
};

const unitCardInvestPill: React.CSSProperties = {
  position: "absolute", top: "0.45rem", right: "0.45rem", zIndex: 2,
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.05rem",
  background: "#fff", borderRadius: 9, padding: "0.28rem 0.45rem",
  boxShadow: "0 6px 12px -6px rgba(14,23,38,0.35)",
};
const unitCardInvestLabel: React.CSSProperties = { fontSize: "0.52rem", color: "var(--c-text-tertiary)", fontWeight: 600 };
const unitCardInvestValue: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "0.78rem", fontWeight: 800,
  color: "var(--c-positive)", letterSpacing: "-0.02em",
};

const unitCardOverlay: React.CSSProperties = {
  position: "absolute", left: 0, right: 0, bottom: 0, padding: "0.6rem",
  display: "flex", flexDirection: "column", gap: "0.3rem",
};
const unitCardAddr: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.2rem", color: "rgba(255,255,255,0.7)" };
const unitCardAddrText: React.CSSProperties = { fontSize: "0.6rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

const unitCardStatRow: React.CSSProperties = { display: "flex", gap: "0.3rem", flexWrap: "wrap" };
const unitCardStatChip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.18rem",
  background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: "0.56rem", fontWeight: 600,
  padding: "0.16rem 0.38rem", borderRadius: 999, backdropFilter: "blur(4px)",
};

const unitCardValorM2Box: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.08rem",
  alignSelf: "flex-start", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 9, padding: "0.3rem 0.5rem", backdropFilter: "blur(6px)",
  boxShadow: "0px 2px 2px rgba(0,0,0,0.25)", marginTop: "0.15rem",
};
const unitCardValorM2Value: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "0.72rem", fontWeight: 800, color: "#fff",
  letterSpacing: "-0.02em", lineHeight: 1, textShadow: "0px 2px 2px rgba(0,0,0,0.25)",
};
const unitCardValorM2Label: React.CSSProperties = {
  fontSize: "0.5rem", fontWeight: 600, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em",
  textShadow: "0px 2px 2px rgba(0,0,0,0.25)",
};

const carouselNav: React.CSSProperties = { display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0 2.1rem", marginTop: "-0.75rem", marginBottom: "0.75rem" };
const navBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--c-border)",
  background: "var(--c-surface)", color: "var(--c-ink)", display: "flex", alignItems: "center",
  justifyContent: "center", cursor: "pointer",
};

/* Percentage slider */
const pctBlock: React.CSSProperties = { marginBottom: "0.5rem", display: "flex", flexDirection: "column", gap: "0.65rem", padding: "0 2.1rem" };
const pctReadout: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.15rem" };
const pctReadoutNum: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "2.3rem", fontWeight: 800,
  color: "var(--c-ink)", letterSpacing: "-0.02em", lineHeight: 1,
};
const pctReadoutSym: React.CSSProperties = { fontSize: "1.15rem", fontWeight: 700, color: "var(--c-text-tertiary)" };
const sliderWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem" };
const sliderLabels: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--c-text-tertiary)" };

const resultBox: React.CSSProperties = {
  background: "var(--c-ink)", borderRadius: 16, padding: "1.5rem", margin: "0.5rem 2.1rem 0.75rem",
  display: "flex", flexDirection: "column", gap: "0.4rem",
};
const resultLabel: React.CSSProperties = { fontSize: "0.78rem", color: "var(--c-text-on-dark)", fontWeight: 600 };
const resultValue: React.CSSProperties = {
  fontFamily: "var(--font-display)", fontSize: "1.9rem", fontWeight: 800,
  color: "var(--c-positive-bright)", letterSpacing: "-0.02em", lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
};
const totalValueLabel: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 700, color: "#fff",
  letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.4,
};

const ctaBtn: React.CSSProperties = {
  display: "block", textAlign: "center", padding: "0.9rem", background: "var(--c-accent)", color: "#fff",
  borderRadius: 12, fontWeight: 600, fontSize: "0.95rem", textDecoration: "none",
  boxShadow: "0 12px 26px rgba(27,77,224,0.24)", margin: "0 2.1rem",
};
