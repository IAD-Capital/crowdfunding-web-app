"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Investment = {
  id: number;
  percentage: number;
  amount_usd: number;
  status: string;
  created_at: string;
  unit_id: number;
  identifier: string;
  unit_price_usd: number;
  group_expires_at: string | null;
  development_id: number;
  development_name: string;
  user_id: number;
  full_name: string;
  email: string;
  avatar: string | null;
  removal_requested_at: string | null;
};

const STATUS_OPTS = ["active", "pending", "cancelled"] as const;
const STATUS_LABELS: Record<string, string> = { active: "Activa", pending: "Pendiente", cancelled: "Cancelada" };
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  active:    { bg: "#dcfce7", fg: "#166534" },
  pending:   { bg: "#fef9c3", fg: "#854d0e" },
  cancelled: { bg: "#fee2e2", fg: "#991b1b" },
};

export default function InvestmentsTable({ investments, lang }: { investments: Investment[]; lang: string }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const fmtUsd = (n: number) =>
    `USD ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

  function startEdit(inv: Investment) {
    setEditingId(inv.id);
    setEditStatus(inv.status);
    setError(null);
  }

  async function saveEdit(id: number) {
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error");
      return;
    }
    setEditingId(null);
    startTransition(() => router.refresh());
  }

  async function deleteInv(id: number) {
    if (!confirm("¿Eliminar esta inversión? Esta acción no se puede deshacer.")) return;
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error");
      return;
    }
    startTransition(() => router.refresh());
  }

  async function approveRemoval(id: number) {
    if (!confirm("¿Aprobar la remoción? La inversión pasará a estado cancelada.")) return;
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled", clear_removal_request: true }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return; }
    startTransition(() => router.refresh());
  }

  async function rejectRemoval(id: number) {
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clear_removal_request: true }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return; }
    startTransition(() => router.refresh());
  }

  if (investments.length === 0) {
    return (
      <div style={empty}>
        <span style={{ fontSize: "2.5rem", opacity: 0.15 }}>📊</span>
        <p style={{ margin: 0, color: "#9ca3af" }}>No hay inversiones registradas todavía.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <p style={errorBanner}>{error}</p>}
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              {["Inversor", "Unidad / Emprendimiento", "%", "Monto", "Estado", "Grupo vence", "Fecha", ""].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {investments.map((inv) => {
              const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.active;
              const isEditing = editingId === inv.id;
              const groupExpires = inv.group_expires_at ? new Date(inv.group_expires_at) : null;
              const groupExpired = groupExpires ? groupExpires < new Date() : false;
              const hasPendingRemoval = !!inv.removal_requested_at;

              return (
                <tr key={inv.id} style={isEditing ? trEditing : hasPendingRemoval ? trPendingRemoval : tr}>
                  {/* Investor */}
                  <td style={td}>
                    <div style={userCell}>
                      <div style={avatar}>
                        {inv.avatar ? (
                          <Image src={inv.avatar} alt={inv.full_name} fill style={{ objectFit: "cover", borderRadius: "50%" }} />
                        ) : (
                          <span style={avatarLetter}>{inv.full_name[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p style={userName}>{inv.full_name}</p>
                        <p style={userEmail}>{inv.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Unit */}
                  <td style={td}>
                    <p style={unitId}>{inv.identifier}</p>
                    <p style={devName}>{inv.development_name}</p>
                  </td>

                  {/* Percentage */}
                  <td style={{ ...td, textAlign: "center" }}>
                    <span style={pctBadge}>{inv.percentage}%</span>
                  </td>

                  {/* Amount */}
                  <td style={td}>
                    <p style={amount}>{fmtUsd(inv.amount_usd)}</p>
                    <p style={unitTotal}>de {fmtUsd(inv.unit_price_usd)}</p>
                  </td>

                  {/* Status */}
                  <td style={td}>
                    {isEditing ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        style={selectInput}
                      >
                        {STATUS_OPTS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ ...statusBadge, background: sc.bg, color: sc.fg }}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    )}
                  </td>

                  {/* Group expiry */}
                  <td style={td}>
                    {groupExpires ? (
                      <span style={{ fontSize: "0.78rem", color: groupExpired ? "#991b1b" : "#374151", fontWeight: groupExpired ? 700 : 400 }}>
                        {groupExpired ? "⛔ " : ""}{fmtDate(groupExpires.toISOString())}
                      </span>
                    ) : (
                      <span style={{ color: "#d1d5db", fontSize: "0.78rem" }}>—</span>
                    )}
                  </td>

                  {/* Date */}
                  <td style={{ ...td, color: "#9ca3af", fontSize: "0.78rem" }}>
                    {fmtDate(inv.created_at)}
                  </td>

                  {/* Actions */}
                  <td style={{ ...td, textAlign: "right" }}>
                    {isEditing ? (
                      <div style={actionRow}>
                        <button style={btnSave} onClick={() => saveEdit(inv.id)} disabled={isPending}>Guardar</button>
                        <button style={btnCancel} onClick={() => setEditingId(null)}>Cancelar</button>
                      </div>
                    ) : hasPendingRemoval ? (
                      <div style={{ ...actionRow, flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                        <span style={removalLabel}>⚠️ Remoción solicitada</span>
                        <div style={actionRow}>
                          <button style={btnApprove} onClick={() => approveRemoval(inv.id)} disabled={isPending}>
                            Aprobar
                          </button>
                          <button style={btnReject} onClick={() => rejectRemoval(inv.id)} disabled={isPending}>
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={actionRow}>
                        <button style={btnEdit} onClick={() => startEdit(inv)}>Editar</button>
                        <button style={btnDelete} onClick={() => deleteInv(inv.id)}>Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const tableWrap: React.CSSProperties = { overflowX: "auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const th: React.CSSProperties = { padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.04em" };
const tr: React.CSSProperties = { borderBottom: "1px solid #f3f4f6" };
const trEditing: React.CSSProperties = { ...tr, background: "#f0f9ff" };
const td: React.CSSProperties = { padding: "0.85rem 1rem", verticalAlign: "middle" };

const userCell: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.6rem" };
const avatar: React.CSSProperties = { position: "relative", width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" };
const avatarLetter: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 700, color: "#374151" };
const userName: React.CSSProperties = { fontWeight: 600, margin: 0, color: "#111", fontSize: "0.85rem" };
const userEmail: React.CSSProperties = { color: "#9ca3af", margin: 0, fontSize: "0.72rem" };

const unitId: React.CSSProperties = { fontWeight: 700, margin: 0, fontSize: "0.85rem" };
const devName: React.CSSProperties = { color: "#9ca3af", margin: 0, fontSize: "0.72rem" };

const pctBadge: React.CSSProperties = { display: "inline-block", padding: "0.2rem 0.55rem", background: "#f3f4f6", borderRadius: 999, fontWeight: 800, fontSize: "0.85rem" };
const amount: React.CSSProperties = { fontWeight: 800, margin: 0, fontSize: "0.9rem" };
const unitTotal: React.CSSProperties = { color: "#9ca3af", margin: 0, fontSize: "0.72rem" };

const statusBadge: React.CSSProperties = { padding: "0.2rem 0.55rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, display: "inline-block" };
const selectInput: React.CSSProperties = { padding: "0.3rem 0.5rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.82rem" };

const actionRow: React.CSSProperties = { display: "flex", gap: "0.4rem", justifyContent: "flex-end" };
const btnEdit: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };
const btnSave: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "none", borderRadius: 6, background: "#111", color: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };
const btnCancel: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: "0.78rem" };
const btnDelete: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "none", borderRadius: 6, background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };

const trPendingRemoval: React.CSSProperties = { ...tr, background: "#fffbeb" };
const removalLabel: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 700, color: "#92400e" };
const btnApprove: React.CSSProperties = { padding: "0.3rem 0.65rem", border: "none", borderRadius: 6, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 };
const btnReject: React.CSSProperties = { padding: "0.3rem 0.65rem", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };
const empty: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "4rem 2rem", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 };
const errorBanner: React.CSSProperties = { background: "#fee2e2", color: "#991b1b", padding: "0.6rem 1rem", borderRadius: 8, fontSize: "0.85rem", marginBottom: "1rem" };
