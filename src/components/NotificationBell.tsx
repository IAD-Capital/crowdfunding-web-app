"use client";

import { useState, useRef, useEffect } from "react";

export type NotificationAction = {
  label: string;
  url: string;
  method: "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  variant: "primary" | "danger" | "ghost";
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  href?: string;
  timestamp: string;
  variant: "pending" | "info" | "warning" | "success";
  ackUrl?: string;
  actions?: NotificationAction[];
};

type Props = {
  notifications: Notification[];
  dark?: boolean;
  sidebarExpanded?: boolean;
};

export default function NotificationBell({ notifications: initial, dark = false, sidebarExpanded }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const notifications = initial.filter((n) => !dismissed.has(n.id));
  const count = notifications.length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function dismiss(n: Notification) {
    if (!n.ackUrl) return;
    setDismissed((prev) => new Set(Array.from(prev).concat(n.id)));
    await fetch(n.ackUrl, { method: "POST" });
  }

  async function runAction(n: Notification, action: NotificationAction) {
    const key = `${n.id}-${action.label}`;
    setLoadingAction(key);
    try {
      const res = await fetch(action.url, {
        method: action.method,
        headers: action.body ? { "Content-Type": "application/json" } : undefined,
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (res.ok) {
        // Dismiss the notification after action
        setDismissed((prev) => new Set(Array.from(prev).concat(n.id)));
      }
    } finally {
      setLoadingAction(null);
    }
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    });

  const VS: Record<Notification["variant"], { icon: string; bg: string; fg: string }> = {
    pending: { icon: "⏳", bg: "#fffbeb", fg: "#92400e" },
    warning: { icon: "⚠️",  bg: "#fef2f2", fg: "#991b1b" },
    info:    { icon: "ℹ️",  bg: "#f0f9ff", fg: "#0369a1" },
    success: { icon: "✅", bg: "#f0fdf4", fg: "#166534" },
  };

  const ACTION_STYLES: Record<NotificationAction["variant"], React.CSSProperties> = {
    primary: { background: "#111", color: "#fff", border: "none" },
    danger:  { background: "#dc2626", color: "#fff", border: "none" },
    ghost:   { background: "#fff", color: "#374151", border: "1px solid #d1d5db" },
  };

  const inSidebar = sidebarExpanded !== undefined;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "relative", background: "none", border: "none",
          cursor: "pointer", padding: "0.55rem 0.75rem", borderRadius: 8,
          display: "flex", alignItems: "center",
          gap: inSidebar ? "0.7rem" : 0,
          justifyContent: sidebarExpanded ? "flex-start" : "center",
          width: inSidebar ? "100%" : "auto",
          color: dark ? "#d1d5db" : "#6b7280",
          transition: "background 0.12s, color 0.12s",
        }}
        className="sidebar-section-btn"
        aria-label="Notificaciones"
      >
        <span style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {count > 0 && (
            <span style={{
              position: "absolute", top: -3, right: -5,
              minWidth: 15, height: 15, borderRadius: 999,
              background: "#ef4444", color: "#fff",
              fontSize: "0.58rem", fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 3px", lineHeight: 1,
              border: "2px solid #fff",
            }}>
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        {sidebarExpanded && (
          <span style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" }}>
            Notificaciones
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ ...dropdown, ...(inSidebar ? dropdownSidebar : {}) }}>
          <div style={dropHeader}>
            <span style={dropTitle}>Notificaciones</span>
            {count > 0 && (
              <span style={dropCount}>{count} pendiente{count !== 1 ? "s" : ""}</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={emptyState}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>Sin notificaciones</p>
            </div>
          ) : (
            <ul style={list}>
              {notifications.map((n) => {
                const vs = VS[n.variant];
                return (
                  <li key={n.id} style={{ listStyle: "none", position: "relative" }}>
                    <div style={{ ...notifItem, background: vs.bg }}>
                      {/* Header row */}
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>{vs.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: vs.fg }}>{n.title}</p>
                          <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.4 }}>{n.body}</p>
                          <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", color: "#9ca3af" }}>{fmtDate(n.timestamp)}</p>
                        </div>
                        {/* Dismiss */}
                        {n.ackUrl && (
                          <button onClick={() => dismiss(n)} style={xBtn} title="Marcar como visto">✕</button>
                        )}
                      </div>

                      {/* Inline action buttons */}
                      {n.actions && n.actions.length > 0 && (
                        <div style={actionsRow}>
                          {n.actions.map((action) => {
                            const key = `${n.id}-${action.label}`;
                            return (
                              <button
                                key={action.label}
                                style={{ ...actionBtn, ...ACTION_STYLES[action.variant] }}
                                disabled={loadingAction === key}
                                onClick={() => runAction(n, action)}
                              >
                                {loadingAction === key ? "…" : action.label}
                              </button>
                            );
                          })}
                          {n.href && (
                            <a href={n.href} style={viewLink} onClick={() => setOpen(false)}>
                              Ver →
                            </a>
                          )}
                        </div>
                      )}

                      {/* Simple link (no actions) */}
                      {!n.actions && n.href && (
                        <a href={n.href} style={viewLinkStandalone} onClick={() => setOpen(false)}>
                          Ver detalles →
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const dropdown: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 8px)", right: 0,
  width: 320, background: "#fff",
  border: "1px solid #e5e7eb", borderRadius: 12,
  boxShadow: "0 8px 30px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden",
};
const dropdownSidebar: React.CSSProperties = {
  top: "auto", bottom: "calc(100% + 8px)", right: "auto", left: 0,
};
const dropHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6",
};
const dropTitle: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 700, color: "#111" };
const dropCount: React.CSSProperties = {
  fontSize: "0.7rem", fontWeight: 700,
  background: "#fee2e2", color: "#991b1b",
  padding: "0.15rem 0.5rem", borderRadius: 999,
};
const list: React.CSSProperties = {
  margin: 0, padding: "0.4rem",
  display: "flex", flexDirection: "column", gap: "0.3rem",
  maxHeight: 420, overflowY: "auto",
};
const notifItem: React.CSSProperties = {
  padding: "0.7rem 0.75rem", borderRadius: 8,
  display: "flex", flexDirection: "column", gap: "0.6rem",
};
const emptyState: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  gap: "0.5rem", padding: "2rem 1rem",
};
const xBtn: React.CSSProperties = {
  flexShrink: 0, background: "rgba(0,0,0,0.06)", border: "none",
  borderRadius: 4, width: 18, height: 18,
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.6rem", cursor: "pointer", color: "#6b7280", padding: 0,
};
const actionsRow: React.CSSProperties = {
  display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center",
};
const actionBtn: React.CSSProperties = {
  padding: "0.3rem 0.7rem", borderRadius: 6,
  fontSize: "0.75rem", fontWeight: 700, cursor: "pointer",
};
const viewLink: React.CSSProperties = {
  fontSize: "0.72rem", color: "#6b7280", textDecoration: "none",
  marginLeft: "auto", fontWeight: 600,
};
const viewLinkStandalone: React.CSSProperties = {
  fontSize: "0.75rem", color: "#6b7280", textDecoration: "none", fontWeight: 600,
};
