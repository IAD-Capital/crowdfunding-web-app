"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  unitId: number;
  priceUsd: number;
  identifier: string;
  lang: string;
  availablePct?: number;
};

type Mode = "slider" | "fixed" | "full";

export default function BuyPanel({ unitId, priceUsd, identifier, lang, availablePct = 100 }: Props) {
  const router = useRouter();
  const maxSlider = Math.min(50, availablePct);
  const hasOtherInvestors = availablePct < 100;

  const [mode, setMode] = useState<Mode>("slider");
  const [pct, setPct] = useState(Math.min(5, maxSlider));
  const [fixedAmountStr, setFixedAmountStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fixedAmount = Number(fixedAmountStr);
  const fixedPct = priceUsd > 0 && Number.isFinite(fixedAmount) && fixedAmount > 0
    ? (fixedAmount / priceUsd) * 100
    : null;

  const effectivePct =
    mode === "full" ? 100
    : mode === "fixed" ? (fixedPct ?? 0)
    : pct;
  const amount =
    mode === "fixed" && Number.isFinite(fixedAmount) && fixedAmount > 0
      ? fixedAmount
      : (priceUsd * effectivePct) / 100;

  const fixedError =
    mode === "fixed" && fixedAmount > 0 && fixedPct != null && fixedPct < 5
      ? `El monto mínimo es USD ${Math.ceil(priceUsd * 0.05).toLocaleString("es-AR")} (5%).`
      : null;

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

  function reset() {
    setDone(false);
    setMode("slider");
    setPct(Math.min(5, maxSlider));
    setFixedAmountStr("");
    setError(null);
  }

  if (done) {
    return (
      <div style={panelSuccess}>
        <div>
          <p style={{ fontWeight: 700, margin: 0 }}>¡Solicitud enviada!</p>
          <p style={{ color: "#166534", fontSize: "0.82rem", margin: "0.2rem 0 0" }}>
            Solicitaste el {effectivePct.toFixed(2).replace(/\.?0+$/, "")}% de {identifier} por USD {amount.toLocaleString("es-AR", { maximumFractionDigits: 0 })}.
            Tu inversión quedará confirmada una vez que sea aprobada.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button style={reinvestBtn} onClick={reset}>Invertir de nuevo</button>
          <a href={`/${lang}/wallet`} style={walletLink}>Ver mi cartera →</a>
        </div>
      </div>
    );
  }

  const canSubmit = !fixedError && (
    (mode === "slider" && pct >= 5 && pct <= maxSlider) ||
    (mode === "fixed" && fixedPct != null && fixedPct >= 5) ||
    mode === "full"
  );

  return (
    <div style={panel}>
      <p style={panelTitle}>Invertir en {identifier}</p>

      {/* Mode selector */}
      <div style={modeTabs}>
        <button style={{ ...modeTab, ...(mode === "slider" ? modeTabActive : {}) }} onClick={() => setMode("slider")}>
          % Participación
        </button>
        <button style={{ ...modeTab, ...(mode === "fixed" ? modeTabActive : {}) }} onClick={() => setMode("fixed")}>
          Monto fijo
        </button>
        <button style={{ ...modeTab, ...(mode === "full" ? modeTabActive : {}) }} onClick={() => setMode("full")}>
          100% · Platino
        </button>
      </div>

      {/* Slider mode */}
      {mode === "slider" && (
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
            type="range" min={5} max={maxSlider} step={5} value={pct}
            onChange={(e) => setPct(Number(e.target.value))}
            className="buy-slider"
            disabled={maxSlider < 5}
          />
        </div>
      )}

      {/* Fixed amount mode */}
      {mode === "fixed" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={inputLabel}>Monto en USD</label>
          <div style={usdInputWrap}>
            <span style={usdPrefix}>USD</span>
            <input
              style={usdInput}
              type="number"
              min={0}
              step={100}
              placeholder="ej. 75000"
              value={fixedAmountStr}
              onChange={(e) => setFixedAmountStr(e.target.value)}
            />
          </div>
          {fixedPct != null && fixedAmount > 0 && !fixedError && (
            <p style={fixedHint}>Equivale al {fixedPct.toFixed(2).replace(/\.?0+$/, "")}% de la unidad</p>
          )}
          {fixedError && <p style={errorMsg}>{fixedError}</p>}
        </div>
      )}

      {/* Platinum warning */}
      {mode === "full" && hasOtherInvestors && (
        <p style={platinumWarning}>
          Al ser aprobada, esta inversión cancelará las participaciones existentes de otros inversores en esta unidad.
        </p>
      )}

      {/* Percentage display */}
      <div style={pctDisplay}>
        <span style={pctBig}>
          {mode === "fixed" && fixedPct != null && fixedAmount > 0
            ? fixedPct.toFixed(1).replace(/\.0$/, "")
            : effectivePct}
          <span style={pctSymbol}>%</span>
        </span>
        <span style={pctLabel}>de participación</span>
      </div>

      {/* Summary */}
      <div style={summary}>
        <div style={summaryRow}>
          <span style={summaryLabel}>Tu inversión</span>
          <span style={summaryAmount}>
            USD {amount > 0 ? amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "—"}
          </span>
        </div>
        <div style={{ ...summaryRow, borderTop: "1px solid #e5e7eb", paddingTop: "0.4rem", marginTop: "0.1rem" }}>
          <span style={summaryLabel}>Valor total UF</span>
          <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>
            USD {Number(priceUsd).toLocaleString("es-AR")}
          </span>
        </div>
        {availablePct < 100 && mode !== "full" && (
          <div style={{ ...summaryRow, paddingTop: "0.25rem" }}>
            <span style={{ ...summaryLabel, color: "#d97706" }}>Disponible</span>
            <span style={{ fontSize: "0.82rem", color: "#d97706", fontWeight: 600 }}>{availablePct.toFixed(0)}% restante</span>
          </div>
        )}
      </div>

      {error && <p style={errorMsg}>{error}</p>}

      <button
        style={{ ...btnBuy, opacity: loading || !canSubmit ? 0.5 : 1, cursor: canSubmit ? "pointer" : "not-allowed" }}
        onClick={handleBuy}
        disabled={loading || !canSubmit}
      >
        {loading ? "Procesando…" : `Confirmar inversión · ${
          mode === "full" ? "100%" :
          mode === "fixed" && fixedPct != null && fixedAmount > 0 ? `${fixedPct.toFixed(1).replace(/\.0$/, "")}%` :
          `${pct}%`
        }`}
      </button>
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14,
  padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem",
};
const panelTitle: React.CSSProperties = { fontWeight: 700, fontSize: "0.95rem", color: "#111", margin: 0 };

const modeTabs: React.CSSProperties = { display: "flex", gap: "0.4rem" };
const modeTab: React.CSSProperties = {
  flex: 1, padding: "0.45rem 0.3rem", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600,
  cursor: "pointer", border: "1.5px solid #d1d5db", background: "#fff", color: "#6b7280",
  transition: "all 0.15s", textAlign: "center",
};
const modeTabActive: React.CSSProperties = {
  border: "1.5px solid #111", background: "#111", color: "#fff",
};

const sliderWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem" };
const sliderLabels: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#9ca3af" };

const inputLabel: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 600, color: "#374151" };
const usdInputWrap: React.CSSProperties = { display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden" };
const usdPrefix: React.CSSProperties = { padding: "0.6rem 0.75rem", background: "#f3f4f6", fontSize: "0.85rem", fontWeight: 600, color: "#6b7280", borderRight: "1px solid #d1d5db" };
const usdInput: React.CSSProperties = { flex: 1, padding: "0.6rem 0.75rem", border: "none", outline: "none", fontSize: "0.95rem", fontWeight: 600, color: "#111" };
const fixedHint: React.CSSProperties = { fontSize: "0.75rem", color: "#6b7280", margin: 0 };

const platinumWarning: React.CSSProperties = {
  fontSize: "0.78rem", color: "#92400e", background: "#fffbeb",
  border: "1px solid #fde68a", borderRadius: 8, padding: "0.6rem 0.75rem", margin: 0, lineHeight: 1.5,
};

const pctDisplay: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem", padding: "0.5rem 0" };
const pctBig: React.CSSProperties = { fontSize: "3.5rem", fontWeight: 900, color: "#111", lineHeight: 1, letterSpacing: "-0.05em" };
const pctSymbol: React.CSSProperties = { fontSize: "2rem", fontWeight: 700, color: "#6b7280" };
const pctLabel: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", fontWeight: 500 };

const summary: React.CSSProperties = { background: "#f9fafb", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem" };
const summaryRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const summaryLabel: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };
const summaryAmount: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 800, color: "#111" };

const errorMsg: React.CSSProperties = { color: "#dc2626", fontSize: "0.82rem", margin: 0, background: "#fee2e2", borderRadius: 8, padding: "0.5rem 0.75rem" };
const btnBuy: React.CSSProperties = {
  background: "#111", color: "#fff", border: "none", borderRadius: 10,
  padding: "0.8rem 1rem", fontWeight: 700, fontSize: "0.9rem",
  width: "100%", transition: "opacity 0.15s",
};

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
