"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneRequiredNotice from "./PhoneRequiredNotice";
import { trackCtaClick } from "@/lib/analytics";

type Props = {
  unitId: number;
  priceUsd: number;
  identifier: string;
  lang: string;
  availablePct?: number;
  hasPhone?: boolean;
};

type Mode = "pct" | "full";

export default function BuyPanel({ unitId, priceUsd, identifier, lang, availablePct = 100, hasPhone = true }: Props) {
  const router = useRouter();
  const maxSlider = Math.min(50, availablePct);
  const hasOtherInvestors = availablePct < 100;

  const quickPcts = Array.from(new Set([5, 10, 25, 30, 35, 40, 45, 50, maxSlider]))
    .filter((p) => p >= 5 && p <= maxSlider)
    .sort((a, b) => a - b);

  const [mode, setMode] = useState<Mode>("pct");
  const [pct, setPct] = useState(Math.min(5, maxSlider));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectivePct = mode === "full" ? 100 : pct;
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
    trackCtaClick("buy_panel_confirm", { label: identifier, location: "unit_page", percentage: effectivePct, amount_usd: amount });
    setDone(true);
    router.refresh();
  }

  function reset() {
    setDone(false);
    setMode("pct");
    setPct(Math.min(5, maxSlider));
    setError(null);
  }

  if (!hasPhone) {
    return <PhoneRequiredNotice lang={lang} />;
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
          <button
            style={reinvestBtn}
            onClick={() => { trackCtaClick("buy_panel_reinvest", { label: identifier, location: "unit_page" }); reset(); }}
          >
            Invertir de nuevo
          </button>
          <a
            href={`/${lang}/wallet`}
            style={walletLink}
            onClick={() => trackCtaClick("buy_panel_view_wallet", { label: identifier, location: "unit_page" })}
          >
            Ver mi cartera →
          </a>
        </div>
      </div>
    );
  }

  const canSubmit = (mode === "pct" && pct >= 5 && pct <= maxSlider) || mode === "full";

  return (
    <div style={panel}>
      <p style={panelTitle}>Invertir en {identifier}</p>

      {/* Mode selector */}
      <div style={modeTabs}>
        <button style={{ ...modeTab, ...(mode === "pct" ? modeTabActive : {}) }} onClick={() => setMode("pct")}>
          % Participación
        </button>
        <button style={{ ...modeTab, ...(mode === "full" ? modeTabActive : {}) }} onClick={() => setMode("full")}>
          100% · Platino
        </button>
      </div>

      {/* Percentage mode: quick-select buttons */}
      {mode === "pct" && (
        quickPcts.length > 0 ? (
          <div style={pctButtonsWrap}>
            {quickPcts.map((p) => (
              <button
                key={p}
                style={{ ...pctButton, ...(pct === p ? pctButtonActive : {}) }}
                onClick={() => setPct(p)}
              >
                {p === maxSlider && p !== 50 ? `Disponible · ${p}%` : `${p}%`}
              </button>
            ))}
          </div>
        ) : (
          <p style={errorMsg}>No hay porcentaje disponible para invertir en esta unidad.</p>
        )
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
          {effectivePct}
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
          <span style={summaryLabel}>Valor de la unidad</span>
          <span style={summaryUnitValue}>
            USD {Number(priceUsd).toLocaleString("es-AR")}
          </span>
        </div>
        <div style={summaryRow}>
          <span style={summaryLabel}>Monto mínimo (5%)</span>
          <span style={summaryMinAmount}>
            USD {Math.ceil(priceUsd * 0.05).toLocaleString("es-AR")}
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

      <p style={noPaymentNote}>
        No se paga nada ahora. Tu solicitud sirve para coordinar una reunión y avanzar con la inversión.
      </p>

      <button
        style={{ ...btnBuy, opacity: loading || !canSubmit ? 0.5 : 1, cursor: canSubmit ? "pointer" : "not-allowed" }}
        onClick={() => {
          trackCtaClick("buy_panel_submit", { label: identifier, location: "unit_page", percentage: effectivePct });
          handleBuy();
        }}
        disabled={loading || !canSubmit}
      >
        {loading ? "Procesando…" : `Confirmar inversión · ${mode === "full" ? "100%" : `${pct}%`}`}
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

const pctButtonsWrap: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.5rem" };
const pctButton: React.CSSProperties = {
  flex: "1 1 auto", padding: "0.6rem 0.75rem", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700,
  cursor: "pointer", border: "1.5px solid #d1d5db", background: "#fff", color: "#374151",
  transition: "all 0.15s", textAlign: "center", whiteSpace: "nowrap",
};
const pctButtonActive: React.CSSProperties = {
  border: "1.5px solid #111", background: "#111", color: "#fff",
};

const platinumWarning: React.CSSProperties = {
  fontSize: "0.78rem", color: "#92400e", background: "#fffbeb",
  border: "1px solid #fde68a", borderRadius: 8, padding: "0.6rem 0.75rem", margin: 0, lineHeight: 1.5,
};

const pctDisplay: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem", padding: "0.5rem 0" };
const pctBig: React.CSSProperties = { fontSize: "3.5rem", fontWeight: 900, color: "#111", lineHeight: 1 };
const pctSymbol: React.CSSProperties = { fontSize: "2rem", fontWeight: 700, color: "#6b7280" };
const pctLabel: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", fontWeight: 500 };

const summary: React.CSSProperties = { background: "#f9fafb", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.4rem" };
const summaryRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const summaryLabel: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };
const summaryAmount: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 800, color: "#111" };
const summaryUnitValue: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 600, color: "#6b7280" };
const summaryMinAmount: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 700, color: "#111" };

const errorMsg: React.CSSProperties = { color: "#dc2626", fontSize: "0.82rem", margin: 0, background: "#fee2e2", borderRadius: 8, padding: "0.5rem 0.75rem" };
const noPaymentNote: React.CSSProperties = { fontSize: "0.78rem", color: "#1e40af", margin: 0, background: "#eff6ff", borderRadius: 8, padding: "0.5rem 0.75rem", lineHeight: 1.4 };
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
