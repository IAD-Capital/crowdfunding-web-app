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

type UnitGroup = {
  unit_id: number;
  identifier: string;
  development_name: string;
  unit_price_usd: number;
  group_expires_at: string | null;
  investments: Investment[];
  soldPct: number;
  totalAmount: number;
  pendingRemovals: number;
  pendingApprovals: number;
};

const STATUS_OPTS = ["pending", "approved", "rejected", "cancelled"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de aprobación", approved: "Aprobada", rejected: "Rechazada", cancelled: "Cancelada",
};
const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending:   { bg: "#fef9c3", fg: "#854d0e" },
  approved:  { bg: "#dcfce7", fg: "#166534" },
  rejected:  { bg: "#fee2e2", fg: "#991b1b" },
  cancelled: { bg: "#fee2e2", fg: "#991b1b" },
};

function groupByUnit(investments: Investment[]): UnitGroup[] {
  const map = new Map<number, UnitGroup>();
  for (const inv of investments) {
    if (!map.has(inv.unit_id)) {
      map.set(inv.unit_id, {
        unit_id: inv.unit_id,
        identifier: inv.identifier,
        development_name: inv.development_name,
        unit_price_usd: inv.unit_price_usd,
        group_expires_at: inv.group_expires_at,
        investments: [],
        soldPct: 0,
        totalAmount: 0,
        pendingRemovals: 0,
        pendingApprovals: 0,
      });
    }
    const g = map.get(inv.unit_id)!;
    g.investments.push(inv);
    if (inv.status === "approved") {
      g.soldPct += inv.percentage;
      g.totalAmount += inv.amount_usd;
    }
    if (inv.removal_requested_at && inv.status === "approved") g.pendingRemovals++;
    if (inv.status === "pending") g.pendingApprovals++;
  }
  return Array.from(map.values());
}

export default function InvestmentsTable({ investments, lang }: { investments: Investment[]; lang: string }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterDevelopment, setFilterDevelopment] = useState<string>("");
  const [filterInvestor, setFilterInvestor] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const developments = Array.from(
    new Map(investments.map((i) => [i.development_id, i.development_name])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const investors = Array.from(
    new Map(investments.map((i) => [i.user_id, { name: i.full_name, email: i.email }])).entries()
  ).sort((a, b) => a[1].name.localeCompare(b[1].name));

  const filtered = investments.filter((inv) => {
    if (filterDevelopment && String(inv.development_id) !== filterDevelopment) return false;
    if (filterInvestor && String(inv.user_id) !== filterInvestor) return false;
    if (filterStatus && inv.status !== filterStatus) return false;
    return true;
  });

  const groups = groupByUnit(filtered);

  const fmtUsd = (n: number) =>
    `USD ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

  const daysUntil = (d: Date): number =>
    Math.ceil((d.getTime() - Date.now()) / 86_400_000);

  function toggleCollapse(unitId: number) {
    setCollapsed((prev) => {
      const next = new Set(Array.from(prev));
      next.has(unitId) ? next.delete(unitId) : next.add(unitId);
      return next;
    });
  }

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
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return; }
    setEditingId(null);
    startTransition(() => router.refresh());
  }

  async function deleteInv(id: number) {
    if (!confirm("¿Eliminar esta inversión? Esta acción no se puede deshacer.")) return;
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return; }
    startTransition(() => router.refresh());
  }

  async function approveRemoval(id: number) {
    if (!confirm("¿Aprobar la remoción? La inversión pasará a estado cancelada.")) return;
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
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

  async function approveInvestment(id: number) {
    if (!confirm("¿Aprobar esta solicitud de inversión?")) return;
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return; }
    startTransition(() => router.refresh());
  }

  async function rejectInvestment(id: number) {
    if (!confirm("¿Rechazar esta solicitud de inversión?")) return;
    setError(null);
    const res = await fetch(`/api/admin/investments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Error"); return; }
    startTransition(() => router.refresh());
  }

  if (investments.length === 0) {
    return (
      <div style={empty}>
        <p style={{ margin: 0, color: "#9ca3af" }}>No hay inversiones registradas todavía.</p>
      </div>
    );
  }

  const hasFilters = filterDevelopment || filterInvestor || filterStatus;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Filter bar */}
      <div style={filterBar}>
        <div style={filterGroup}>
          <label style={filterLabel}>Emprendimiento</label>
          <select style={filterSelect} value={filterDevelopment} onChange={(e) => setFilterDevelopment(e.target.value)}>
            <option value="">Todos</option>
            {developments.map(([id, name]) => (
              <option key={id} value={String(id)}>{name}</option>
            ))}
          </select>
        </div>
        <div style={filterGroup}>
          <label style={filterLabel}>Inversor</label>
          <select style={filterSelect} value={filterInvestor} onChange={(e) => setFilterInvestor(e.target.value)}>
            <option value="">Todos</option>
            {investors.map(([id, u]) => (
              <option key={id} value={String(id)}>{u.name} — {u.email}</option>
            ))}
          </select>
        </div>
        <div style={filterGroup}>
          <label style={filterLabel}>Estado</label>
          <select style={filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button style={clearBtn} onClick={() => { setFilterDevelopment(""); setFilterInvestor(""); setFilterStatus(""); }}>
            Limpiar filtros
          </button>
        )}
        <span style={filterCount}>
          {filtered.length} inversión{filtered.length !== 1 ? "es" : ""} · {groups.length} unidad{groups.length !== 1 ? "es" : ""}
        </span>
      </div>

      {error && <p style={errorBanner}>{error}</p>}

      {groups.length === 0 && (
        <div style={empty}>
          <p style={{ margin: 0, color: "#9ca3af" }}>Sin resultados para los filtros seleccionados.</p>
        </div>
      )}

      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.unit_id);
        const groupExpires = group.group_expires_at ? new Date(group.group_expires_at) : null;
        const groupExpired = groupExpires ? groupExpires < new Date() : false;
        const availPct = Math.max(0, 100 - group.soldPct);

        return (
          <div key={group.unit_id} style={groupCard}>
            {/* Group header */}
            <button style={groupHeader} onClick={() => toggleCollapse(group.unit_id)}>
              <div style={groupHeaderLeft}>
                {/* Collapse chevron */}
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", transition: "transform 0.15s", transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}>
                  ▼
                </span>

                {/* Unit identity */}
                <div>
                  <div style={groupTitle}>
                    {group.identifier}
                    {group.pendingApprovals > 0 && (
                      <span style={pendingPill}>{group.pendingApprovals} solicitud{group.pendingApprovals > 1 ? "es" : ""} por aprobar</span>
                    )}
                    {group.pendingRemovals > 0 && (
                      <span style={pendingPill}>{group.pendingRemovals} remoción{group.pendingRemovals > 1 ? "es" : ""} pendiente{group.pendingRemovals > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <div style={groupSub}>{group.development_name}</div>
                </div>
              </div>

              <div style={groupHeaderRight}>
                {/* Progress bar */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", minWidth: 160 }}>
                  <div style={progressBar}>
                    <div style={{ ...progressFill, width: `${Math.min(100, group.soldPct)}%` }} />
                  </div>
                  <span style={progressLabel}>
                    {group.soldPct}% vendido · {availPct}% disponible
                  </span>
                </div>

                {/* Stats */}
                <div style={groupStats}>
                  <StatChip label="Inversores" value={String(group.investments.length)} />
                  <StatChip label="Invertido" value={fmtUsd(group.totalAmount)} accent />
                </div>

                {/* Expiry */}
                {groupExpires && (() => {
                  const days = daysUntil(groupExpires);
                  const urgent = !groupExpired && days <= 30;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.15rem" }}>
                      <span style={{ ...expiryChip, ...(groupExpired ? expiryExpired : urgent ? expiryUrgent : {}) }}>
                        {groupExpired
                          ? `venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`
                          : days === 0
                          ? "vence hoy"
                          : `restan ${days} día${days !== 1 ? "s" : ""}`}
                      </span>
                      <span style={{ fontSize: "0.62rem", color: "#9ca3af" }}>{fmtDate(groupExpires.toISOString())}</span>
                    </div>
                  );
                })()}
              </div>
            </button>

            {/* Investor rows */}
            {!isCollapsed && (
              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      {["Inversor", "%", "Monto", "Estado", "Fecha", ""].map((h) => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.investments.map((inv) => {
                      const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.pending;
                      const isEditing = editingId === inv.id;
                      const hasPendingRemoval = !!inv.removal_requested_at;
                      const isPendingApproval = inv.status === "pending";

                      return (
                        <tr id={`investment-${inv.id}`} key={inv.id} style={isEditing ? trEditing : isPendingApproval ? trPendingApproval : hasPendingRemoval ? trPendingRemoval : tr}>
                          {/* Investor */}
                          <td style={td}>
                            <div style={userCell}>
                              <div style={avatarWrap}>
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

                          {/* Percentage */}
                          <td style={{ ...td, textAlign: "center" }}>
                            <span style={pctBadge}>{inv.percentage}%</span>
                          </td>

                          {/* Amount */}
                          <td style={td}>
                            <p style={amountText}>{fmtUsd(inv.amount_usd)}</p>
                          </td>

                          {/* Status */}
                          <td style={td}>
                            {isEditing ? (
                              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={selectInput}>
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
                            ) : isPendingApproval ? (
                              <div style={actionRow}>
                                <button style={btnApprove} onClick={() => approveInvestment(inv.id)} disabled={isPending}>Aprobar</button>
                                <button style={btnReject} onClick={() => rejectInvestment(inv.id)} disabled={isPending}>Rechazar</button>
                              </div>
                            ) : hasPendingRemoval ? (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                                <span style={removalLabel}>Remoción solicitada</span>
                                <div style={actionRow}>
                                  <button style={btnApprove} onClick={() => approveRemoval(inv.id)} disabled={isPending}>Aprobar</button>
                                  <button style={btnReject} onClick={() => rejectRemoval(inv.id)} disabled={isPending}>Rechazar</button>
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
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span style={{ fontSize: "0.65rem", color: accent ? "#6b7280" : "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#111" }}>{value}</span>
    </div>
  );
}

/* Group card */
const groupCard: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" };
const groupHeader: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer",
  gap: "1.5rem", textAlign: "left",
};
const groupHeaderLeft: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 };
const groupHeaderRight: React.CSSProperties = { display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 };
const groupTitle: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 800, color: "#111", display: "flex", alignItems: "center", gap: "0.5rem" };
const groupSub: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.1rem" };
const groupStats: React.CSSProperties = { display: "flex", gap: "1.25rem" };
const pendingPill: React.CSSProperties = {
  fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
  background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 999,
};
const progressBar: React.CSSProperties = { width: 160, height: 6, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" };
const progressFill: React.CSSProperties = { height: "100%", background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: 999, transition: "width 0.3s" };
const progressLabel: React.CSSProperties = { fontSize: "0.68rem", color: "#9ca3af" };
const expiryChip: React.CSSProperties = { fontSize: "0.72rem", color: "#166534", background: "#dcfce7", border: "1px solid #86efac", borderRadius: 999, padding: "0.2rem 0.6rem", fontWeight: 600, whiteSpace: "nowrap" };
const expiryUrgent: React.CSSProperties = { color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a" };
const expiryExpired: React.CSSProperties = { color: "#991b1b", background: "#fee2e2", border: "1px solid #fca5a5" };

/* Inner table */
const tableWrap: React.CSSProperties = { overflowX: "auto", borderTop: "1px solid #f3f4f6" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const th: React.CSSProperties = { padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", background: "#f9fafb", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.04em" };
const tr: React.CSSProperties = { borderBottom: "1px solid #f9fafb" };
const trEditing: React.CSSProperties = { ...tr, background: "#f0f9ff" };
const trPendingRemoval: React.CSSProperties = { ...tr, background: "#fffbeb" };
const trPendingApproval: React.CSSProperties = { ...tr, background: "#fefce8" };
const td: React.CSSProperties = { padding: "0.75rem 1rem", verticalAlign: "middle" };

const userCell: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.6rem" };
const avatarWrap: React.CSSProperties = { position: "relative", width: 30, height: 30, borderRadius: "50%", background: "#e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" };
const avatarLetter: React.CSSProperties = { fontSize: "0.75rem", fontWeight: 700, color: "#374151" };
const userName: React.CSSProperties = { fontWeight: 600, margin: 0, color: "#111", fontSize: "0.85rem" };
const userEmail: React.CSSProperties = { color: "#9ca3af", margin: 0, fontSize: "0.7rem" };

const pctBadge: React.CSSProperties = { display: "inline-block", padding: "0.2rem 0.55rem", background: "#f3f4f6", borderRadius: 999, fontWeight: 800, fontSize: "0.85rem" };
const amountText: React.CSSProperties = { fontWeight: 800, margin: 0, fontSize: "0.88rem" };

const statusBadge: React.CSSProperties = { padding: "0.2rem 0.55rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700, display: "inline-block" };
const selectInput: React.CSSProperties = { padding: "0.3rem 0.5rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.82rem" };

const actionRow: React.CSSProperties = { display: "flex", gap: "0.4rem", justifyContent: "flex-end" };
const btnEdit: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };
const btnSave: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "none", borderRadius: 6, background: "#111", color: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };
const btnCancel: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: "0.78rem" };
const btnDelete: React.CSSProperties = { padding: "0.3rem 0.75rem", border: "none", borderRadius: 6, background: "#fee2e2", color: "#991b1b", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };
const removalLabel: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 700, color: "#92400e" };
const btnApprove: React.CSSProperties = { padding: "0.3rem 0.65rem", border: "none", borderRadius: 6, background: "#dc2626", color: "#fff", cursor: "pointer", fontSize: "0.78rem", fontWeight: 700 };
const btnReject: React.CSSProperties = { padding: "0.3rem 0.65rem", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", color: "#374151", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 };

const empty: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "4rem 2rem", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 };
const errorBanner: React.CSSProperties = { background: "#fee2e2", color: "#991b1b", padding: "0.6rem 1rem", borderRadius: 8, fontSize: "0.85rem", marginBottom: "1rem" };

const filterBar: React.CSSProperties = { display: "flex", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem 1.25rem" };
const filterGroup: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const filterLabel: React.CSSProperties = { fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" };
const filterSelect: React.CSSProperties = { padding: "0.45rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", color: "#111", background: "#fff", minWidth: 200, cursor: "pointer" };
const clearBtn: React.CSSProperties = { padding: "0.45rem 0.9rem", border: "1px solid #d1d5db", borderRadius: 8, background: "#fff", color: "#374151", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, alignSelf: "flex-end" };
const filterCount: React.CSSProperties = { marginLeft: "auto", fontSize: "0.78rem", color: "#9ca3af", alignSelf: "flex-end", whiteSpace: "nowrap" };
