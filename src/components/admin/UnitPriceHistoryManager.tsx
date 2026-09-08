"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown } from "lucide-react";
import { UNIT_PRICE_STAGES, unitPriceStageLabel } from "@/lib/unitPriceStages";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type PriceHistoryEntry = {
  id: number;
  effective_date: string;
  stage: string;
  total_value_usd: number;
  value_per_m2_usd: number | null;
};

type FormState = {
  effective_date: string;
  stage: string;
  total_value_usd: string;
  value_per_m2_usd: string;
};

const EMPTY_FORM: FormState = { effective_date: "", stage: UNIT_PRICE_STAGES[0].value, total_value_usd: "", value_per_m2_usd: "" };

function fmtUsd(v: number) {
  return `USD ${Number(v).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function UnitPriceHistoryManager({ unitId, initial }: { unitId: number; initial: PriceHistoryEntry[] }) {
  const router = useRouter();
  const sorted = [...initial].sort((a, b) => a.effective_date.localeCompare(b.effective_date) || a.id - b.id);
  const [entries, setEntries] = useState(sorted);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    router.refresh();
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.effective_date || !form.stage || !form.total_value_usd) {
      setError("Fecha, estado y valor total son obligatorios.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/units/${unitId}/price-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        effective_date: form.effective_date,
        stage: form.stage,
        total_value_usd: parseFloat(form.total_value_usd),
        value_per_m2_usd: form.value_per_m2_usd ? parseFloat(form.value_per_m2_usd) : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Error al guardar.");
      return;
    }
    const next = [...entries, data].sort((a, b) => a.effective_date.localeCompare(b.effective_date) || a.id - b.id);
    setEntries(next);
    setForm(EMPTY_FORM);
    refresh();
  }

  function startEdit(entry: PriceHistoryEntry) {
    setEditingId(entry.id);
    setEditForm({
      effective_date: entry.effective_date.slice(0, 10),
      stage: entry.stage,
      total_value_usd: String(entry.total_value_usd),
      value_per_m2_usd: entry.value_per_m2_usd != null ? String(entry.value_per_m2_usd) : "",
    });
  }

  async function handleSaveEdit(id: number) {
    setError("");
    if (!editForm.effective_date || !editForm.stage || !editForm.total_value_usd) {
      setError("Fecha, estado y valor total son obligatorios.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/units/${unitId}/price-history/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        effective_date: editForm.effective_date,
        stage: editForm.stage,
        total_value_usd: parseFloat(editForm.total_value_usd),
        value_per_m2_usd: editForm.value_per_m2_usd ? parseFloat(editForm.value_per_m2_usd) : null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Error al guardar.");
      return;
    }
    const next = entries
      .map((en) => (en.id === id ? data : en))
      .sort((a, b) => a.effective_date.localeCompare(b.effective_date) || a.id - b.id);
    setEntries(next);
    setEditingId(null);
    refresh();
  }

  function handleDeleted(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    refresh();
  }

  return (
    <div style={wrap}>
      <h2 style={title}>Historial de precios</h2>
      <p style={hint}>
        Se muestra en la página pública de la unidad, con la variación porcentual respecto al registro anterior.
        Si no cargás ningún registro, esa sección no aparece.
      </p>

      {entries.length === 0 ? (
        <p style={emptyText}>Todavía no hay historial cargado para esta unidad.</p>
      ) : (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Estado</th>
                <th style={th}>Valor total</th>
                <th style={th}>Valor m²</th>
                <th style={th}>Variación</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const prev = entries[i - 1];
                const pct = prev ? ((Number(entry.total_value_usd) - Number(prev.total_value_usd)) / Number(prev.total_value_usd)) * 100 : null;
                const isEditing = editingId === entry.id;

                if (isEditing) {
                  return (
                    <tr key={entry.id} style={row}>
                      <td style={td} colSpan={6}>
                        <div style={editRow}>
                          <input
                            style={editInput}
                            type="date"
                            value={editForm.effective_date}
                            onChange={(e) => setEditForm((f) => ({ ...f, effective_date: e.target.value }))}
                          />
                          <select
                            style={editInput}
                            value={editForm.stage}
                            onChange={(e) => setEditForm((f) => ({ ...f, stage: e.target.value }))}
                          >
                            {UNIT_PRICE_STAGES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <input
                            style={editInput}
                            type="number" step="0.01" min="0"
                            placeholder="Valor total (USD)"
                            value={editForm.total_value_usd}
                            onChange={(e) => setEditForm((f) => ({ ...f, total_value_usd: e.target.value }))}
                          />
                          <input
                            style={editInput}
                            type="number" step="0.01" min="0"
                            placeholder="Valor m² (USD)"
                            value={editForm.value_per_m2_usd}
                            onChange={(e) => setEditForm((f) => ({ ...f, value_per_m2_usd: e.target.value }))}
                          />
                          <div style={editActions}>
                            <button type="button" style={btnSecondary} onClick={() => setEditingId(null)} disabled={saving}>
                              Cancelar
                            </button>
                            <button type="button" style={btnPrimary} onClick={() => handleSaveEdit(entry.id)} disabled={saving}>
                              {saving ? "Guardando…" : "Guardar"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={entry.id} style={row}>
                    <td style={td}>{fmtDate(entry.effective_date)}</td>
                    <td style={td}>
                      <span style={stagePill}>{unitPriceStageLabel(entry.stage)}</span>
                    </td>
                    <td style={td}>{fmtUsd(entry.total_value_usd)}</td>
                    <td style={td}>{entry.value_per_m2_usd != null ? fmtUsd(entry.value_per_m2_usd) : "—"}</td>
                    <td style={td}>
                      {pct == null ? (
                        <span style={{ color: "#9ca3af" }}>—</span>
                      ) : (
                        <span style={{ ...pctPill, ...(pct >= 0 ? pctUp : pctDown) }}>
                          {pct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                      <button type="button" style={linkBtn} onClick={() => startEdit(entry)}>Editar</button>
                      <DeleteWithConfirmButton
                        deleteUrl={`/api/admin/units/${unitId}/price-history/${entry.id}`}
                        confirmText={fmtDate(entry.effective_date)}
                        label="Eliminar"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleAdd} style={addForm}>
        <input
          style={input}
          type="date"
          value={form.effective_date}
          onChange={(e) => setForm((f) => ({ ...f, effective_date: e.target.value }))}
          required
        />
        <select
          style={input}
          value={form.stage}
          onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
        >
          {UNIT_PRICE_STAGES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          style={input}
          type="number" step="0.01" min="0"
          placeholder="Valor total (USD)"
          value={form.total_value_usd}
          onChange={(e) => setForm((f) => ({ ...f, total_value_usd: e.target.value }))}
          required
        />
        <input
          style={input}
          type="number" step="0.01" min="0"
          placeholder="Valor m² (USD, opcional)"
          value={form.value_per_m2_usd}
          onChange={(e) => setForm((f) => ({ ...f, value_per_m2_usd: e.target.value }))}
        />
        <button type="submit" style={btnPrimary} disabled={saving}>
          {saving ? "Agregando…" : "+ Agregar"}
        </button>
      </form>

      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb", marginTop: "1.5rem" };
const title: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.35rem" };
const hint: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280", margin: "0 0 1.25rem", lineHeight: 1.5 };
const emptyText: React.CSSProperties = { fontSize: "0.85rem", color: "#9ca3af", margin: "0 0 1.25rem" };

const tableWrap: React.CSSProperties = { background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", overflowX: "auto", marginBottom: "1.25rem" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" };
const th: React.CSSProperties = { padding: "0.6rem 0.85rem", textAlign: "left", background: "#f3f4f6", fontWeight: 600, fontSize: "0.75rem", color: "#6b7280" };
const row: React.CSSProperties = { borderTop: "1px solid #e5e7eb" };
const td: React.CSSProperties = { padding: "0.6rem 0.85rem", color: "#111", background: "#fff" };

const stagePill: React.CSSProperties = { display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, background: "#eff3ff", color: "#1b4de0" };
const pctPill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: 999 };
const pctUp: React.CSSProperties = { background: "#dcfce7", color: "#166534" };
const pctDown: React.CSSProperties = { background: "#fee2e2", color: "#991b1b" };

const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#1b4de0", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", marginRight: "0.75rem", padding: 0 };

const addForm: React.CSSProperties = { display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { padding: "0.55rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.9rem", flex: "1 1 160px", outline: "none" };
const editRow: React.CSSProperties = { display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" };
const editInput: React.CSSProperties = { padding: "0.5rem 0.65rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", flex: "1 1 140px", outline: "none" };
const editActions: React.CSSProperties = { display: "flex", gap: "0.5rem" };

const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.85rem", marginTop: "0.75rem" };
const btnPrimary: React.CSSProperties = { padding: "0.6rem 1.1rem", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.88rem", whiteSpace: "nowrap" };
const btnSecondary: React.CSSProperties = { padding: "0.5rem 0.9rem", background: "#fff", color: "#111", border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" };
