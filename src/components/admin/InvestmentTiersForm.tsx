"use client";

import { useState, FormEvent } from "react";
import type { TierThresholds } from "@/lib/investmentTiers";

type Props = { initial: TierThresholds };

export default function InvestmentTiersForm({ initial }: Props) {
  const [bronzeFrom, setBronzeFrom] = useState(String(initial.bronze_from));
  const [silverFrom, setSilverFrom] = useState(String(initial.silver_from));
  const [goldFrom, setGoldFrom] = useState(String(initial.gold_from));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/admin/settings/investment-tiers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bronze_from: Number(bronzeFrom),
        silver_from: Number(silverFrom),
        gold_from: Number(goldFrom),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al guardar.");
      return;
    }
    setSuccess(true);
  }

  return (
    <div style={wrap}>
      <h2 style={title}>Tipos de inversión</h2>
      <p style={hint}>
        Definí desde qué monto comienza cada tipo de inversión.
        Platino aplica automáticamente a partir de Oro.
      </p>

      <form onSubmit={handleSubmit} style={form}>
        <Field label="Bronce — desde (USD)">
          <input
            style={input}
            type="number"
            min={0}
            step={100}
            value={bronzeFrom}
            onChange={(e) => setBronzeFrom(e.target.value)}
            required
          />
        </Field>

        <Field label="Plata — desde (USD)">
          <input
            style={input}
            type="number"
            min={0}
            step={100}
            value={silverFrom}
            onChange={(e) => setSilverFrom(e.target.value)}
            required
          />
        </Field>

        <Field label="Oro — desde (USD)">
          <input
            style={input}
            type="number"
            min={0}
            step={100}
            value={goldFrom}
            onChange={(e) => setGoldFrom(e.target.value)}
            required
          />
        </Field>

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>Guardado correctamente.</p>}

        <div style={actions}>
          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb", maxWidth: 480 };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" };
const hint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none",
};
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626" };
const successStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#166534" };
const actions: React.CSSProperties = { display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" };
const btnPrimary: React.CSSProperties = {
  padding: "0.55rem 1.25rem", background: "#111", color: "#fff",
  borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", border: "none", cursor: "pointer",
};
