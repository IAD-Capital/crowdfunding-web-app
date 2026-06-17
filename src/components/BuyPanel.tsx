"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  unitId: number;
  priceUsd: number;
  identifier: string;
  lang: string;
  availablePct?: number; // max purchasable (100 - already sold)
};

export default function BuyPanel({ unitId, priceUsd, identifier, lang, availablePct = 100 }: Props) {
  const router = useRouter();
  // Valid values: 5–50 (step 5) or 100. Cap to available.
  const maxSlider = Math.min(50, availablePct);
  const can100 = availablePct >= 100;
  const [pct, setPct] = useState(Math.min(5, maxSlider));
  const [full, setFull] = useState(false); // 100% mode
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (done) {
    return (
      <div style={panelSuccess}>
        <span style={{ fontSize: "1.5rem" }}>🎉</span>
        <div>
          <p style={{ fontWeight: 700, margin: 0 }}>¡Inversión confirmada!</p>
          <p style={{ color: "#166534", fontSize: "0.82rem", margin: "0.2rem 0 0" }}>
            Adquiriste el {effectivePct}% de {identifier} por USD {amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            style={reinvestBtn}
            onClick={() => { setDone(false); setFull(false); setPct(Math.min(5, maxSlider)); setError(null); }}
          >
            Invertir de nuevo
          </button>
          <a href={`/${lang}/wallet`} style={walletLink}>Ver mi cartera →</a>
        </div>
      </div>
    );
  }

  return (
    <div style={panel}>
      <p style={panelTitle}>Invertir en {identifier}</p>

      {/* Slider 5–50 */}
      <div style={sliderWrap}>
        <div style={sliderLabels}>
          <span>5%</span>
          <span>50%</span>
        </div>
        <style>{`
          input[type=range].buy-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; accent-color: #111; cursor: pointer; }
          input[type=range].buy-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%;
            background: #111; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;
          }
          input[type=range].buy-slider::-moz-range-thumb {
            width: 22px; height: 22px; border-radius: 50%;
            background: #111; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: pointer;
          }
        `}</style>
        <input
          type="range" min={5} max={Math.min(50, maxSlider)} step={5} value={full ? 5 : pct}
          onChange={(e) => { setFull(false); setPct(Number(e.target.value)); }}
          className="buy-slider"
          disabled={maxSlider < 5}
        />
      </div>

      {/* 100% option */}
      {can100 && (
        <button
          style={{ ...btn100, ...(full ? btn100Active : {}) }}
          onClick={() => setFull(!full)}
        >
          {full ? "✓ " : ""}Adquirir el 100%
        </button>
      )}

      {/* Big percentage display */}
      <div style={pctDisplay}>
        <span style={pctBig}>{effectivePct}<span style={pctSymbol}>%</span></span>
        <span style={pctLabel}>de participación</span>
      </div>

      {/* Summary */}
      <div style={summary}>
        <div style={summaryRow}>
          <span style={summaryLabel}>Tu inversión</span>
          <span style={summaryAmount}>
            USD {amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div style={{ ...summaryRow, borderTop: "1px solid #e5e7eb", paddingTop: "0.4rem", marginTop: "0.1rem" }}>
          <span style={summaryLabel}>Valor total UF</span>
          <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>
            USD {Number(priceUsd).toLocaleString("es-AR")}
          </span>
        </div>
        {availablePct < 100 && (
          <div style={{ ...summaryRow, paddingTop: "0.25rem" }}>
            <span style={{ ...summaryLabel, color: "#d97706" }}>Disponible</span>
            <span style={{ fontSize: "0.82rem", color: "#d97706", fontWeight: 600 }}>hasta {Math.min(50, availablePct)}% o 100%</span>
          </div>
        )}
      </div>

      {error && <p style={errorMsg}>{error}</p>}

      <button
        style={{ ...btnBuy, opacity: loading ? 0.7 : 1 }}
        onClick={handleBuy}
        disabled={loading}
      >
        {loading ? "Procesando…" : `Confirmar inversión · ${effectivePct}%`}
      </button>
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14,
  padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem",
};
const panelTitle: React.CSSProperties = { fontWeight: 700, fontSize: "0.95rem", color: "#111", margin: 0 };

/* Slider */
const sliderWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem" };
const sliderLabels: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" };
const btn100: React.CSSProperties = {
  padding: "0.45rem 0.75rem", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
  cursor: "pointer", border: "1.5px solid #d1d5db", background: "#fff", color: "#374151",
  transition: "all 0.15s", textAlign: "left",
};
const btn100Active: React.CSSProperties = {
  border: "1.5px solid #111", background: "#111", color: "#fff",
};

/* Percentage display */
const pctDisplay: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem", padding: "0.5rem 0" };
const pctBig: React.CSSProperties = { fontSize: "3.5rem", fontWeight: 900, color: "#111", lineHeight: 1, letterSpacing: "-0.05em" };
const pctSymbol: React.CSSProperties = { fontSize: "2rem", fontWeight: 700, color: "#6b7280" };
const pctLabel: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", fontWeight: 500 };

/* Summary */
const summary: React.CSSProperties = { background: "#f9fafb", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem" };
const summaryRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const summaryLabel: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };
const summaryAmount: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 800, color: "#111" };

const errorMsg: React.CSSProperties = { color: "#dc2626", fontSize: "0.82rem", margin: 0, background: "#fee2e2", borderRadius: 8, padding: "0.5rem 0.75rem" };
const btnBuy: React.CSSProperties = {
  background: "#111", color: "#fff", border: "none", borderRadius: 10,
  padding: "0.8rem 1rem", fontWeight: 700, fontSize: "0.9rem",
  cursor: "pointer", width: "100%", transition: "opacity 0.15s",
};

/* Success state */
const panelSuccess: React.CSSProperties = {
  background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14,
  padding: "1.25rem", display: "flex", flexDirection: "column", alignItems: "center",
  gap: "0.75rem", textAlign: "center",
};
const walletLink: React.CSSProperties = {
  padding: "0.5rem 1.25rem", background: "#111", color: "#fff",
  borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "0.85rem",
};
const reinvestBtn: React.CSSProperties = {
  padding: "0.5rem 1.25rem", background: "#fff", color: "#166534",
  border: "1.5px solid #86efac", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem",
  cursor: "pointer",
};
