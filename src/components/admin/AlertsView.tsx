"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Bell, MessageCircle } from "lucide-react";
import type { Notification, NotificationAction } from "@/components/NotificationBell";

type Props = { notifications: Notification[] };

const VS: Record<Notification["variant"], { bg: string; fg: string }> = {
  pending: { bg: "#fffbeb", fg: "#92400e" },
  warning: { bg: "#fef2f2", fg: "#991b1b" },
  info:    { bg: "#f0f9ff", fg: "#0369a1" },
  success: { bg: "#f0fdf4", fg: "#166534" },
};

const ACTION_STYLES: Record<NotificationAction["variant"], React.CSSProperties> = {
  primary: { background: "#111", color: "#fff", border: "none" },
  danger:  { background: "#dc2626", color: "#fff", border: "none" },
  ghost:   { background: "#fff", color: "#374151", border: "1px solid #d1d5db" },
};

const spinStyle: React.CSSProperties = { animation: "admin-alerts-spin 0.8s linear infinite" };

export default function AlertsView({ notifications }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const actionable = notifications.filter((n) => n.actions && n.actions.length > 0);
  const info = notifications.filter((n) => !n.actions || n.actions.length === 0);

  const selectedCount = actionable.filter((n) => selected.has(n.id)).length;
  const allSelected = actionable.length > 0 && actionable.every((n) => selected.has(n.id));

  function toggle(id: string) {
    if (busy) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (busy) return;
    setSelected(allSelected ? new Set() : new Set(actionable.map((n) => n.id)));
  }

  async function callAction(n: Notification, action: NotificationAction): Promise<string | null> {
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: action.body ? { "Content-Type": "application/json" } : undefined,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (res.ok) return null;
      try {
        const data = await res.json();
        return data?.error ?? "No se pudo completar la acción.";
      } catch {
        return "No se pudo completar la acción.";
      }
    } catch {
      return "No se pudo completar la acción.";
    }
  }

  async function runAction(n: Notification, action: NotificationAction) {
    if (busy) return;
    const key = `${n.id}-${action.label}`;
    setBusy(true);
    setLoadingKey(key);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[n.id];
      return next;
    });

    const errorMsg = await callAction(n, action);
    if (errorMsg) {
      setErrors((prev) => ({ ...prev, [n.id]: errorMsg }));
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(n.id);
        return next;
      });
    }

    setBusy(false);
    setLoadingKey(null);
    router.refresh();
  }

  async function runBulkApprove() {
    if (busy) return;
    const targets = actionable
      .filter((n) => selected.has(n.id))
      .map((n) => ({ n, action: n.actions!.find((a) => a.label === "Aprobar") }))
      .filter((t): t is { n: Notification; action: NotificationAction } => !!t.action);
    if (targets.length === 0) return;

    setBusy(true);
    setErrors({});

    for (const { n, action } of targets) {
      setLoadingKey(`${n.id}-${action.label}`);
      const errorMsg = await callAction(n, action);
      if (errorMsg) {
        setErrors((prev) => ({ ...prev, [n.id]: errorMsg }));
      } else {
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(n.id);
          return next;
        });
      }
    }

    setLoadingKey(null);
    setBusy(false);
    router.refresh();
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    });

  if (actionable.length === 0 && info.length === 0) {
    return (
      <div style={emptyState}>
        <Bell size={28} style={{ opacity: 0.2 }} />
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>Sin alertas pendientes</p>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <style>{`@keyframes admin-alerts-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      {actionable.length > 0 && (
        <div style={section}>
          <div style={toolbar}>
            <label style={checkLabel}>
              <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={busy} style={checkInput} />
              Seleccionar todo
            </label>
            {selectedCount > 0 && (
              <span style={selCount}>{selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}</span>
            )}
            {selectedCount > 0 && (
              <button style={{ ...bulkBtn, opacity: busy ? 0.7 : 1 }} onClick={runBulkApprove} disabled={busy}>
                {busy && <Loader2 size={14} style={spinStyle} />}
                {busy ? "Aprobando…" : `Aprobar seleccionadas (${selectedCount})`}
              </button>
            )}
          </div>

          <ul style={list}>
            {actionable.map((n) => {
              const vs = VS[n.variant];
              const error = errors[n.id];
              return (
                <li key={n.id} style={{ listStyle: "none" }}>
                  <div style={{ ...item, background: vs.bg }}>
                    <input
                      type="checkbox"
                      checked={selected.has(n.id)}
                      onChange={() => toggle(n.id)}
                      disabled={busy}
                      style={{ ...checkInput, marginTop: 3, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: vs.fg }}>{n.title}</p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.4 }}>{n.body}</p>
                      <p suppressHydrationWarning style={{ margin: "0.3rem 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{fmtDate(n.timestamp)}</p>
                      {error && <p style={errorText}>{error}</p>}
                      <div style={actionsRow}>
                        {n.actions!.map((action) => {
                          const key = `${n.id}-${action.label}`;
                          const isLoading = loadingKey === key;
                          return (
                            <button
                              key={action.label}
                              style={{ ...actionBtn, ...ACTION_STYLES[action.variant], opacity: busy && !isLoading ? 0.5 : 1 }}
                              disabled={busy}
                              onClick={() => runAction(n, action)}
                            >
                              {isLoading && <Loader2 size={13} style={spinStyle} />}
                              {action.label}
                            </button>
                          );
                        })}
                        {n.href && <a href={n.href} style={viewLink}>Ver →</a>}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {info.length > 0 && (
        <div style={section}>
          <h2 style={sectionTitle}>
            <MessageCircle size={16} /> Preguntas sin responder
          </h2>
          <ul style={list}>
            {info.map((n) => {
              const vs = VS[n.variant];
              return (
                <li key={n.id} style={{ listStyle: "none" }}>
                  <div style={{ ...item, background: vs.bg }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: vs.fg }}>{n.title}</p>
                      <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.4 }}>{n.body}</p>
                      <p suppressHydrationWarning style={{ margin: "0.3rem 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{fmtDate(n.timestamp)}</p>
                      {n.href && (
                        <a href={n.href} style={{ ...viewLink, marginLeft: 0, display: "inline-block", marginTop: "0.4rem" }}>
                          Ver detalles →
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */
const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.5rem" };

const emptyState: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  gap: "0.5rem", padding: "3rem 1rem",
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
};

const section: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem",
};

const sectionTitle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.5rem",
  fontSize: "1rem", fontWeight: 700, margin: 0, color: "#111",
};

const toolbar: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
};
const checkLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#374151" };
const checkInput: React.CSSProperties = { width: 15, height: 15, cursor: "pointer", accentColor: "#1b4de0" };
const selCount: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };

const bulkBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.4rem",
  padding: "0.4rem 0.85rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 7, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
  marginLeft: "auto",
};

const list: React.CSSProperties = {
  margin: 0, padding: 0,
  display: "flex", flexDirection: "column", gap: "0.5rem",
};

const item: React.CSSProperties = {
  padding: "0.85rem 1rem", borderRadius: 8,
  display: "flex", gap: "0.65rem", alignItems: "flex-start",
};

const errorText: React.CSSProperties = { margin: "0.3rem 0 0", fontSize: "0.75rem", color: "#dc2626", fontWeight: 600 };

const actionsRow: React.CSSProperties = {
  display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.6rem",
};
const actionBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.35rem",
  padding: "0.35rem 0.8rem", borderRadius: 6,
  fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
};
const viewLink: React.CSSProperties = {
  fontSize: "0.75rem", color: "#6b7280", textDecoration: "none",
  marginLeft: "auto", fontWeight: 600,
};
