"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import { MIN_ENTRY_PCT } from "@/lib/investmentTiers";

type SimUnit = {
  id: number;
  development_id: number;
  identifier: string;
  price_usd: number;
  status: string;
  available_pct?: number;
};

type SimDevelopment = { id: number; name: string };

type Props = {
  developments: SimDevelopment[];
  units: SimUnit[];
  lang: string;
};

const MIN_PCT = MIN_ENTRY_PCT * 100;

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
  const outOfRange = selectedUnit != null && Number.isFinite(pctNum) && (pctNum < MIN_PCT || pctNum > maxPct);

  if (investable.length === 0) return null;

  return (
    <section style={section}>
      <div style={inner}>
        <div style={header}>
          <span style={eyebrow}>SIMULÁ TU INVERSIÓN</span>
          <h2 style={title}>Poné un porcentaje o un monto y calculá la inversión</h2>
          <p style={subtitle}>Elegí una unidad del catálogo y mirá cuánto representa cada opción.</p>
        </div>

        <div style={card}>
          <div style={field}>
            <label style={label}>Unidad funcional</label>
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

          {selectedUnit && (
            <Link
              href={`/${lang}/emprendimientos/${selectedUnit.development_id}/unidades/${selectedUnit.id}`}
              style={{ ...ctaBtn, ...(outOfRange ? ctaBtnDisabled : {}) }}
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
const section: React.CSSProperties = { background: "#fff", padding: "4rem 1.5rem" };
const inner: React.CSSProperties = { maxWidth: 720, margin: "0 auto" };
const header: React.CSSProperties = { textAlign: "center", marginBottom: "2rem" };
const eyebrow: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 800, color: "#6b7280", letterSpacing: "0.08em" };
const title: React.CSSProperties = { fontSize: "1.6rem", fontWeight: 800, margin: "0.5rem 0", letterSpacing: "-0.02em" };
const subtitle: React.CSSProperties = { fontSize: "0.9rem", color: "#6b7280", margin: 0 };

const card: React.CSSProperties = {
  background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 16,
  padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.1rem",
};
const field: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: 130 };
const label: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 700, color: "#374151" };
const select: React.CSSProperties = {
  padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 10,
  fontSize: "0.9rem", background: "#fff", outline: "none",
};
const inputsRow: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap" };
const numInput: React.CSSProperties = {
  padding: "0.6rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 10,
  fontSize: "1rem", fontWeight: 700, outline: "none", width: "100%",
};
const swapIcon: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  width: 32, height: 32, borderRadius: "50%", background: "#fff",
  border: "1px solid #e5e7eb", color: "#6b7280", marginBottom: "0.45rem", flexShrink: 0,
};
const hint: React.CSSProperties = { fontSize: "0.78rem", color: "#6b7280", margin: 0, lineHeight: 1.5 };
const errorMsg: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626", margin: 0, fontWeight: 600 };
const ctaBtn: React.CSSProperties = {
  display: "block", textAlign: "center", padding: "0.7rem", background: "#111", color: "#fff",
  borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
};
const ctaBtnDisabled: React.CSSProperties = { background: "#9ca3af", pointerEvents: "none" };
