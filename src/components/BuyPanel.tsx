"use client";

import { useState } from "react";

type Props = {
  unitId: number;
  priceUsd: number;
  identifier: string;
  lang: string;
};

const STEPS = [5, 10, 15, 20, 25, 30, 40, 50, 100];

export default function BuyPanel({ priceUsd, identifier }: Props) {
  const [pct, setPct] = useState(5);
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<"preset" | "custom">("preset");

  const effectivePct = mode === "custom" ? Math.min(100, Math.max(1, Number(custom) || 5)) : pct;
  const amount = (priceUsd * effectivePct) / 100;

  return (
    <div style={panel}>
      <p style={panelTitle}>Invertir en {identifier}</p>

      <p style={panelLabel}>Porcentaje a adquirir</p>
      <div style={chips}>
        {STEPS.map((s) => (
          <button
            key={s}
            style={chip(mode === "preset" && pct === s)}
            onClick={() => { setPct(s); setMode("preset"); }}
          >
            {s}%
          </button>
        ))}
        <button
          style={chip(mode === "custom")}
          onClick={() => setMode("custom")}
        >
          Otro
        </button>
      </div>

      {mode === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
          <input
            style={customInput}
            type="number"
            min={1}
            max={100}
            placeholder="ej. 7"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            autoFocus
          />
          <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>%</span>
        </div>
      )}

      <div style={summary}>
        <div style={summaryRow}>
          <span style={summaryLabel}>Porcentaje</span>
          <span style={summaryVal}>{effectivePct}%</span>
        </div>
        <div style={summaryRow}>
          <span style={summaryLabel}>Inversión</span>
          <span style={{ ...summaryVal, fontWeight: 800, fontSize: "1.15rem", color: "#111" }}>
            USD {amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
        <div style={{ ...summaryRow, borderTop: "1px solid #e5e7eb", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
          <span style={summaryLabel}>Valor total UF</span>
          <span style={summaryVal}>USD {Number(priceUsd).toLocaleString("es-AR")}</span>
        </div>
      </div>

      <button style={btnBuy} onClick={() => alert("Funcionalidad de compra próximamente.")}>
        Solicitar inversión → {effectivePct}%
      </button>
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem",
};
const panelTitle: React.CSSProperties = { fontWeight: 700, fontSize: "0.95rem", color: "#111", margin: 0 };
const panelLabel: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", margin: 0, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" };
const chips: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.35rem" };
const chip = (active: boolean): React.CSSProperties => ({
  padding: "0.3rem 0.65rem", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600,
  cursor: "pointer", border: `1.5px solid ${active ? "#111" : "#d1d5db"}`,
  background: active ? "#111" : "#fff", color: active ? "#fff" : "#374151",
  transition: "all 0.15s",
});
const customInput: React.CSSProperties = {
  padding: "0.4rem 0.65rem", border: "1.5px solid #111", borderRadius: 8,
  fontSize: "0.9rem", width: 80, outline: "none",
};
const summary: React.CSSProperties = {
  background: "#f9fafb", borderRadius: 8, padding: "0.75rem 1rem",
  display: "flex", flexDirection: "column", gap: "0.4rem",
};
const summaryRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const summaryLabel: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };
const summaryVal: React.CSSProperties = { fontSize: "0.9rem", fontWeight: 600, color: "#111" };
const btnBuy: React.CSSProperties = {
  background: "#111", color: "#fff", border: "none", borderRadius: 10,
  padding: "0.7rem 1rem", fontWeight: 700, fontSize: "0.9rem",
  cursor: "pointer", width: "100%", marginTop: "0.25rem",
};
