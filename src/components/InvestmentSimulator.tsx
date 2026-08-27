"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import { MIN_ENTRY_PCT } from "@/lib/investmentTiers";
import { trackCtaClick } from "@/lib/analytics";

type SimUnit = {
  id: number;
  development_id: number;
  identifier: string;
  price_usd: number;
  status: string;
  available_pct?: number;
};

type SimDevelopment = { id: number; name: string; slug?: string | null };

type Props = {
  developments: SimDevelopment[];
  units: SimUnit[];
  lang: string;
};

const MIN_PCT = MIN_ENTRY_PCT * 100;
const PROJECTED_ANNUAL_RETURN_PCT = 18;

export default function InvestmentSimulator({ developments, units, lang }: Props) {
  const investable = useMemo(
    () => units.filter((u) => u.status !== "sold" && (u.available_pct ?? 100) > 0),
    [units]
  );

  const [selectedId, setSelectedId] = useState<number | "">(investable[0]?.id ?? "");
  const [pctStr, setPctStr] = useState(String(MIN_PCT));
  const [amountStr, setAmountStr] = useState("");

  const selectedUnit = investable.find((u) => u.id === selectedId) ?? null;
  const devName = selectedUnit ? developments.find((d) => d.id === selectedUnit.development_id)?.name ?? "" : "";
  const maxPct = selectedUnit ? Math.min(100, selectedUnit.available_pct ?? 100) : 100;
  const price = selectedUnit?.price_usd ?? 0;

  const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

  function syncFromPct(value: string) {
    setPctStr(value);
    const n = Number(value);
    setAmountStr(Number.isFinite(n) && price > 0 ? String(Math.round((price * n) / 100)) : "");
  }

  function syncFromAmount(value: string) {
    setAmountStr(value);
    const n = Number(value);
    setPctStr(Number.isFinite(n) && price > 0 ? ((n / price) * 100).toFixed(2) : "");
  }

  function handleSelectUnit(id: number) {
    setSelectedId(id);
    const unit = investable.find((u) => u.id === id);
    if (!unit) return;
    const startPct = Math.min(MIN_PCT, Math.min(100, unit.available_pct ?? 100));
    setPctStr(String(startPct));
    setAmountStr(String(Math.round((unit.price_usd * startPct) / 100)));
  }

  const pctNum = Number(pctStr);
  const amountNum = Number(amountStr);
  const outOfRange = selectedUnit != null && Number.isFinite(pctNum) && (pctNum < MIN_PCT || pctNum > maxPct);
  const returnAmount = Number.isFinite(amountNum) ? amountNum * (PROJECTED_ANNUAL_RETURN_PCT / 100) : 0;

  if (investable.length === 0) return null;

  return (
    <section style={section}>
      <style>{`
        @media (max-width: 860px) {
          .sim-inner { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={inner} className="sim-inner">
        <div style={copy}>
          <span style={eyebrow}>Simulá tu inversión</span>
          <h2 style={title}>Poné un porcentaje y calculá tu entrada</h2>
          <p style={subtitle}>Elegí una unidad del catálogo y mirá al instante cuánto representa cada opción de inversión.</p>
          <ul style={perks}>
            <li style={perk}><span style={checkIcon}>✓</span>Sin mínimo de capital elevado</li>
            <li style={perk}><span style={checkIcon}>✓</span>Resultados claros antes de invertir</li>
            <li style={perk}><span style={checkIcon}>✓</span>Seguimiento en tiempo real de tu cartera</li>
          </ul>
        </div>

        <div style={card}>
          <label style={label}>Unidad funcional</label>
          <div style={selectWrap}>
            <select
              style={select}
              value={selectedId}
              onChange={(e) => handleSelectUnit(Number(e.target.value))}
            >
              {investable.map((u) => {
                const name = developments.find((d) => d.id === u.development_id)?.name ?? "";
                return (
                  <option key={u.id} value={u.id}>
                    {u.identifier} · {name} · {fmtUsd(u.price_usd)}
                  </option>
                );
              })}
            </select>
          </div>

          <div style={inputsRow}>
            <div style={field}>
              <label style={label}>Porcentaje (%)</label>
              <input
                style={numInput}
                type="number"
                min={MIN_PCT}
                max={maxPct}
                step={0.5}
                value={pctStr}
                onChange={(e) => syncFromPct(e.target.value)}
              />
            </div>

            <div style={swapIcon}>
              <ArrowRightLeft size={16} />
            </div>

            <div style={field}>
              <label style={label}>Monto (USD)</label>
              <input
                style={numInput}
                type="number"
                min={0}
                step={100}
                value={amountStr}
                onChange={(e) => syncFromAmount(e.target.value)}
              />
            </div>
          </div>

          {selectedUnit && (
            <p style={hint}>
              {devName} — {selectedUnit.identifier}: mínimo {MIN_PCT}% ({fmtUsd((price * MIN_PCT) / 100)}),
              {" "}máximo disponible {maxPct}% ({fmtUsd((price * maxPct) / 100)})
            </p>
          )}

          {outOfRange && (
            <p style={errorMsg}>
              El monto debe estar entre {MIN_PCT}% y {maxPct}% para esta unidad.
            </p>
          )}

          <div style={resultBox}>
            <div>
              <div style={resultLabel}>Tu inversión</div>
              <div style={resultValue}>{amountStr ? fmtUsd(Number(amountStr)) : "—"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={resultLabel}>Retorno proyec.</div>
              <div style={resultReturn}>{amountStr ? `+${fmtUsd(returnAmount)}` : "—"}</div>
            </div>
          </div>

          {selectedUnit && (
            <Link
              href={`/${lang}/developments/${developments.find(d => d.id === selectedUnit.development_id)?.slug ?? selectedUnit.development_id}/units/${selectedUnit.id}`}
              style={{ ...ctaBtn, ...(outOfRange ? ctaBtnDisabled : {}) }}
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
const copy: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.4rem" };
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
  padding: "2.1rem", display: "flex", flexDirection: "column", gap: "0.5rem",
  boxShadow: "0 30px 60px -30px rgba(14,23,38,0.28)",
};
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: 130 };
const label: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 700, color: "var(--c-text-secondary)", marginBottom: "0.5rem" };
const selectWrap: React.CSSProperties = { marginBottom: "1.4rem" };
const select: React.CSSProperties = {
  width: "100%", padding: "0.85rem 0.9rem", border: "1px solid var(--c-border-input)", borderRadius: 11,
  fontSize: "0.92rem", fontWeight: 600, color: "var(--c-ink)", background: "var(--c-field-bg)", outline: "none",
};
const inputsRow: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: "0.85rem", flexWrap: "wrap", marginBottom: "0.5rem" };
const numInput: React.CSSProperties = {
  padding: "0.8rem 0.9rem", border: "1px solid var(--c-border-input)", borderRadius: 11,
  fontSize: "0.95rem", fontWeight: 600, outline: "none", width: "100%",
  color: "var(--c-ink)", background: "var(--c-field-bg)",
};
const swapIcon: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 34, height: 34, borderRadius: "50%", background: "var(--c-surface)",
  border: "1px solid var(--c-border)", color: "var(--c-text-secondary)", marginBottom: "0.85rem", flexShrink: 0,
};
const hint: React.CSSProperties = { fontSize: "0.78rem", color: "var(--c-text-tertiary)", margin: "0 0 0.75rem", lineHeight: 1.5 };
const errorMsg: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626", margin: "0 0 0.75rem", fontWeight: 600 };

const resultBox: React.CSSProperties = {
  background: "var(--c-ink)", borderRadius: 16, padding: "1.5rem",
  display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.75rem",
};
const resultLabel: React.CSSProperties = { fontSize: "0.78rem", color: "var(--c-text-on-dark)", fontWeight: 600, marginBottom: "0.4rem" };
const resultValue: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.9rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 };
const resultReturn: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 800, color: "var(--c-positive-bright)", letterSpacing: "-0.01em" };

const ctaBtn: React.CSSProperties = {
  display: "block", textAlign: "center", padding: "0.9rem", background: "var(--c-accent)", color: "#fff",
  borderRadius: 12, fontWeight: 600, fontSize: "0.95rem", textDecoration: "none",
  boxShadow: "0 12px 26px rgba(27,77,224,0.24)",
};
const ctaBtnDisabled: React.CSSProperties = { background: "var(--c-text-tertiary)", boxShadow: "none", pointerEvents: "none" };
