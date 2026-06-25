"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Props = {
  unitId: number;
  priceUsd: number;
  identifier: string;
  devName: string;
  coverImg?: string | null;
  lang: string;
  availablePct?: number;
  onClose: () => void;
};

export default function BuyDrawer({
  unitId, priceUsd, identifier, devName, coverImg, lang, availablePct = 100, onClose,
}: Props) {
  const router = useRouter();
  const maxSlider = Math.min(50, availablePct);
  const can100 = availablePct >= 100;

  const [pct, setPct] = useState(Math.min(5, maxSlider));
  const [full, setFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const effectivePct = full ? 100 : pct;
  const amount = (priceUsd * effectivePct) / 100;

  async function handleBuy() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit_id: unitId, percentage: effectivePct }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Error al procesar."); return; }
    setDone(true);
    router.refresh();
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{ ...overlay, opacity: visible ? 1 : 0 }}
        onClick={handleClose}
        aria-hidden
      />

      {/* Drawer */}
      <aside style={{ ...drawer, transform: visible ? "translateX(0)" : "translateX(100%)" }}>
        {/* Header */}
        <div style={drawerHeader}>
          <div style={drawerHeaderLeft}>
            {coverImg && (
              <div style={thumbWrap}>
                <Image src={coverImg} alt={identifier} fill style={{ objectFit: "cover", borderRadius: 8 }} />
              </div>
            )}
            <div>
              <p style={drawerDevName}>{devName}</p>
              <h2 style={drawerTitle}>{identifier}</h2>
            </div>
          </div>
          <button style={closeBtn} onClick={handleClose} aria-label="Cerrar">✕</button>
        </div>

        <div style={drawerBody}>
          {done ? (
            /* ── Success state ── */
            <div style={successWrap}>
              <div style={successIcon}>🎉</div>
              <h3 style={successTitle}>¡Solicitud enviada!</h3>
              <p style={successSub}>
                Solicitaste el <strong>{effectivePct}%</strong> de {identifier} por{" "}
                <strong>USD {amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}</strong>.
                Tu inversión quedará confirmada una vez que sea aprobada.
              </p>
              <div style={successActions}>
                <a href={`/${lang}/wallet`} style={btnPrimary}>Ver mi cartera →</a>
                <button
                  style={btnOutline}
                  onClick={() => { setDone(false); setFull(false); setPct(Math.min(5, maxSlider)); setError(null); }}
                >
                  Invertir de nuevo
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Available bar ── */}
              <div style={availSection}>
                <div style={availRow}>
                  <span style={availLabel}>Disponible para invertir</span>
                  <span style={availPct}>{availablePct}%</span>
                </div>
                <div style={availBar}>
                  <div style={{ ...availFill, width: `${100 - availablePct}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                  <span>{100 - availablePct}% ya invertido</span>
                  <span>USD {Number(priceUsd).toLocaleString("es-AR")} valor total</span>
                </div>
              </div>

              {/* ── Percentage selector ── */}
              <div style={sectionBlock}>
                <p style={sectionLabel}>Tu porcentaje de participación</p>

                {/* Big number */}
                <div style={bigPctWrap}>
                  <span style={bigPct}>{effectivePct}</span>
                  <span style={bigPctSym}>%</span>
                </div>

                {/* Slider */}
                {!full && (
                  <div style={sliderWrap}>
                    <style>{`
                      .buy-slider{-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:999px;background:linear-gradient(to right,#111 ${((pct - 5) / (Math.max(maxSlider, 5) - 5)) * 100}%,#e5e7eb ${((pct - 5) / (Math.max(maxSlider, 5) - 5)) * 100}%);cursor:pointer;}
                      .buy-slider::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#111;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;}
                      .buy-slider::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:#111;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;}
                    `}</style>
                    <input
                      type="range" min={5} max={Math.min(50, maxSlider)} step={5}
                      value={pct}
                      onChange={(e) => setPct(Number(e.target.value))}
                      className="buy-slider"
                      disabled={maxSlider < 5}
                    />
                    <div style={sliderLabels}>
                      <span>5%</span>
                      <span>{Math.min(50, maxSlider)}%</span>
                    </div>
                  </div>
                )}

                {/* Quick chips */}
                <div style={chips}>
                  {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].filter((v) => v <= maxSlider).map((v) => (
                    <button
                      key={v}
                      style={{ ...chip, ...(pct === v && !full ? chipActive : {}) }}
                      onClick={() => { setFull(false); setPct(v); }}
                    >
                      {v}%
                    </button>
                  ))}
                  {can100 && (
                    <button
                      style={{ ...chip, ...chipFull, ...(full ? chipFullActive : {}) }}
                      onClick={() => setFull(!full)}
                    >
                      100%
                    </button>
                  )}
                </div>
              </div>

              {/* ── Summary ── */}
              <div style={summaryCard}>
                <div style={summaryRow}>
                  <span style={summaryLabel}>Tu inversión</span>
                  <span style={summaryAmount}>
                    USD {amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div style={summaryDivider} />
                <div style={summaryRow}>
                  <span style={summaryLabel}>Porcentaje</span>
                  <span style={summaryValue}>{effectivePct}% de la unidad</span>
                </div>
                <div style={summaryRow}>
                  <span style={summaryLabel}>Valor total UF</span>
                  <span style={summaryValue}>USD {Number(priceUsd).toLocaleString("es-AR")}</span>
                </div>
              </div>

              {error && <p style={errorMsg}>{error}</p>}
            </>
          )}
        </div>

        {/* Footer CTA */}
        {!done && (
          <div style={drawerFooter}>
            <button
              style={{ ...confirmBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleBuy}
              disabled={loading}
            >
              {loading ? "Procesando…" : `Confirmar inversión · ${effectivePct}%`}
            </button>
            <p style={footerNote}>
              Podés cancelar tu inversión en cualquier momento desde tu cartera.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────── */
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
  zIndex: 1000, transition: "opacity 0.28s ease", backdropFilter: "blur(2px)",
};
const drawer: React.CSSProperties = {
  position: "fixed", top: 0, right: 0, bottom: 0,
  width: "min(480px, 100vw)",
  background: "#fff", zIndex: 1001,
  display: "flex", flexDirection: "column",
  boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
  transition: "transform 0.28s cubic-bezier(0.32,0,0.16,1)",
};
const drawerHeader: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6",
  gap: "1rem", flexShrink: 0,
};
const drawerHeaderLeft: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 };
const thumbWrap: React.CSSProperties = { position: "relative", width: 48, height: 48, borderRadius: 8, overflow: "hidden", flexShrink: 0 };
const drawerDevName: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", margin: 0, fontWeight: 600 };
const drawerTitle: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "#111" };
const closeBtn: React.CSSProperties = {
  background: "#f3f4f6", border: "none", borderRadius: "50%",
  width: 36, height: 36, cursor: "pointer", fontSize: "0.9rem",
  color: "#6b7280", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
};
const drawerBody: React.CSSProperties = {
  flex: 1, overflowY: "auto", padding: "1.5rem",
  display: "flex", flexDirection: "column", gap: "1.5rem",
};
const drawerFooter: React.CSSProperties = {
  padding: "1.25rem 1.5rem", borderTop: "1px solid #f3f4f6",
  display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0,
  background: "#fff",
};

/* Available bar */
const availSection: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem" };
const availRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline" };
const availLabel: React.CSSProperties = { fontSize: "0.75rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" };
const availPct: React.CSSProperties = { fontSize: "1rem", fontWeight: 900, color: "#111" };
const availBar: React.CSSProperties = { height: 8, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" };
const availFill: React.CSSProperties = { height: "100%", background: "linear-gradient(90deg,#4ade80,#22c55e)", borderRadius: 999 };

/* Section */
const sectionBlock: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const sectionLabel: React.CSSProperties = { fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 };

/* Big pct */
const bigPctWrap: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.1rem", padding: "0.5rem 0" };
const bigPct: React.CSSProperties = { fontSize: "5rem", fontWeight: 900, color: "#111", lineHeight: 1, letterSpacing: "-0.05em" };
const bigPctSym: React.CSSProperties = { fontSize: "2.5rem", fontWeight: 700, color: "#9ca3af" };

/* Slider */
const sliderWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const sliderLabels: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#9ca3af" };

/* Chips */
const chips: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.4rem" };
const chip: React.CSSProperties = {
  padding: "0.35rem 0.7rem", borderRadius: 999, border: "1.5px solid #e5e7eb",
  background: "#fff", color: "#374151", fontWeight: 600, fontSize: "0.82rem",
  cursor: "pointer", transition: "all 0.12s",
};
const chipActive: React.CSSProperties = { background: "#111", color: "#fff", border: "1.5px solid #111" };
const chipFull: React.CSSProperties = { borderColor: "#d97706", color: "#d97706" };
const chipFullActive: React.CSSProperties = { background: "#d97706", color: "#fff", borderColor: "#d97706" };

/* Summary */
const summaryCard: React.CSSProperties = { background: "#f9fafb", borderRadius: 12, padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" };
const summaryDivider: React.CSSProperties = { height: 1, background: "#e5e7eb" };
const summaryRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const summaryLabel: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280" };
const summaryAmount: React.CSSProperties = { fontSize: "1.3rem", fontWeight: 900, color: "#111" };
const summaryValue: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 700, color: "#111" };

const errorMsg: React.CSSProperties = { color: "#dc2626", fontSize: "0.82rem", margin: 0, background: "#fee2e2", borderRadius: 8, padding: "0.5rem 0.75rem" };

const confirmBtn: React.CSSProperties = {
  background: "#111", color: "#fff", border: "none", borderRadius: 12,
  padding: "1rem", fontWeight: 700, fontSize: "1rem",
  cursor: "pointer", width: "100%", transition: "opacity 0.15s",
};
const footerNote: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", textAlign: "center", margin: 0 };

/* Success */
const successWrap: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center", padding: "2rem 0" };
const successIcon: React.CSSProperties = { fontSize: "3.5rem" };
const successTitle: React.CSSProperties = { fontSize: "1.3rem", fontWeight: 900, margin: 0 };
const successSub: React.CSSProperties = { color: "#6b7280", fontSize: "0.95rem", margin: 0, lineHeight: 1.6 };
const successActions: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.6rem", width: "100%" };
const btnPrimary: React.CSSProperties = { display: "block", textAlign: "center", padding: "0.85rem", background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.95rem" };
const btnOutline: React.CSSProperties = { display: "block", padding: "0.85rem", background: "#fff", color: "#374151", border: "1.5px solid #d1d5db", borderRadius: 10, fontWeight: 600, fontSize: "0.95rem", cursor: "pointer", width: "100%" };
