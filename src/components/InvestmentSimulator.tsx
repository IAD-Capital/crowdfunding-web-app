"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MIN_ENTRY_PCT } from "@/lib/investmentTiers";
import { trackCtaClick } from "@/lib/analytics";

export type SimUnit = {
  id: number;
  identifier: string;
  images: string[];
  price_usd: number;
  available_pct?: number;
  development_name: string;
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
        const scale = 1.16 - ratio * 0.32;
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
          .sim-unit-card { width: 42% !important; }
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
                  style={{ ...unitCard, ...(active ? unitCardActive : {}) }}
                  onClick={() => handleSelectUnit(u)}
                >
                  <div style={unitCardImageWrap}>
                    {u.images[0] ? (
                      <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} sizes="(max-width: 860px) 42vw, 132px" />
                    ) : (
                      <div style={unitCardImagePlaceholder} />
                    )}
                  </div>
                  <span style={unitCardId}>{u.identifier}</span>
                  <span style={unitCardPrice}>{fmtUsd(u.price_usd)}</span>
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
  padding: "2.1rem 0", display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: 0, overflow: "hidden",
  boxShadow: "0 30px 60px -30px rgba(14,23,38,0.28)",
};
const label: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 700, color: "var(--c-text-secondary)", marginBottom: "0.5rem" };

/* Unit strip (edge-to-edge carousel picker) */
const unitStrip: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.9rem", overflowX: "auto", overflowY: "hidden",
  padding: "0.6rem 0", margin: "0.4rem 0 1.25rem", scrollbarWidth: "none",
  scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
};
const unitCard: React.CSSProperties = {
  flex: "0 0 auto", width: 132, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.45rem",
  padding: "0.4rem", borderRadius: 18, border: "2px solid transparent", background: "transparent",
  cursor: "pointer", transition: "transform 0.15s ease, opacity 0.15s ease, border-color 0.15s, background 0.15s",
  fontFamily: "inherit", scrollSnapAlign: "center",
};
const unitCardActive: React.CSSProperties = { border: "2px solid var(--c-accent)", background: "var(--c-accent-light)" };
const unitCardImageWrap: React.CSSProperties = {
  position: "relative", width: "100%", aspectRatio: "1 / 1", borderRadius: 16, overflow: "hidden",
  background: "linear-gradient(135deg, #e8eef7, #dfe7f2)", flexShrink: 0,
};
const unitCardImagePlaceholder: React.CSSProperties = { position: "absolute", inset: 0 };
const unitCardId: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 700, color: "var(--c-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" };
const unitCardPrice: React.CSSProperties = { fontSize: "0.74rem", fontWeight: 600, color: "var(--c-text-tertiary)", whiteSpace: "nowrap" };

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
