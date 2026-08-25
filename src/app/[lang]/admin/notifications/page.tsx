import db from "@/lib/db";
import PushNotificationForm, { type PushTemplate } from "@/components/admin/PushNotificationForm";
import styles from "@/components/admin/ResponsiveTable.module.scss";

type Stats = { total: number; unique_users: number; anonymous: number };
type Subscriber = {
  id: number;
  user_agent: string | null;
  user_full_name: string | null;
  user_email: string | null;
  created_at: string;
  last_seen_at: string;
};
type SentNotification = {
  id: number;
  title: string;
  body: string;
  url: string | null;
  recipient_count: number;
  success_count: number;
  failure_count: number;
  created_at: string;
  sent_by_name: string | null;
};

function describeDevice(ua: string | null): string {
  if (!ua) return "—";

  const os = /iphone|ipad|ipod/i.test(ua)
    ? "iOS"
    : /android/i.test(ua)
      ? "Android"
      : /mac os x/i.test(ua)
        ? "macOS"
        : /windows/i.test(ua)
          ? "Windows"
          : /linux/i.test(ua)
            ? "Linux"
            : "Otro SO";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome\//i.test(ua)
      ? "Chrome"
      : /firefox\//i.test(ua)
        ? "Firefox"
        : /version\/.*safari/i.test(ua)
          ? "Safari"
          : "Otro navegador";

  return `${browser} · ${os}`;
}

export default async function AdminNotificationsPage() {
  const [[stats], subscribers, history, templates] = await Promise.all([
    db<Stats[]>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(DISTINCT user_id)::int AS unique_users,
        COUNT(*) FILTER (WHERE user_id IS NULL)::int AS anonymous
      FROM push_subscriptions
    `,
    db<Subscriber[]>`
      SELECT
        s.id, s.user_agent, s.created_at, s.last_seen_at,
        u.full_name AS user_full_name, u.email AS user_email
      FROM push_subscriptions s
      LEFT JOIN users u ON u.id = s.user_id
      ORDER BY s.last_seen_at DESC
      LIMIT 50
    `,
    db<SentNotification[]>`
      SELECT
        n.id, n.title, n.body, n.url, n.recipient_count, n.success_count, n.failure_count, n.created_at,
        u.full_name AS sent_by_name
      FROM push_notifications n
      LEFT JOIN users u ON u.id = n.sent_by
      ORDER BY n.created_at DESC
      LIMIT 20
    `,
    db<PushTemplate[]>`
      SELECT id, title, body, url FROM push_templates ORDER BY created_at DESC
    `,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "-0.5rem" }}>Notificaciones</h1>

      <div style={statsRow}>
        <div style={statCard}>
          <span style={statValue}>{stats?.total ?? 0}</span>
          <span style={statLabel}>Dispositivos suscriptos</span>
        </div>
        <div style={statCard}>
          <span style={statValue}>{stats?.unique_users ?? 0}</span>
          <span style={statLabel}>Usuarios identificados</span>
        </div>
        <div style={statCard}>
          <span style={statValue}>{stats?.anonymous ?? 0}</span>
          <span style={statLabel}>Visitantes anónimos</span>
        </div>
      </div>

      <PushNotificationForm initialTemplates={templates} />

      <div style={historyWrap} className={styles.wrap}>
        <h2 style={historyTitle}>Dispositivos suscriptos</h2>
        {subscribers.length === 0 ? (
          <p style={emptyText}>Todavía no hay dispositivos suscriptos.</p>
        ) : (
          <table style={table} className={styles.table}>
            <thead>
              <tr>
                <th style={th}>Dispositivo</th>
                <th style={th}>Usuario</th>
                <th style={th}>Alta</th>
                <th style={th}>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.id}>
                  <td style={td} data-label="Dispositivo">{describeDevice(sub.user_agent)}</td>
                  <td style={td} data-label="Usuario">
                    {sub.user_full_name ? `${sub.user_full_name} (${sub.user_email})` : "Anónimo"}
                  </td>
                  <td style={td} data-label="Alta">
                    {new Date(sub.created_at).toLocaleString("es-AR", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td style={td} data-label="Última actividad">
                    {new Date(sub.last_seen_at).toLocaleString("es-AR", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={historyWrap} className={styles.wrap}>
        <h2 style={historyTitle}>Historial de envíos</h2>
        {history.length === 0 ? (
          <p style={emptyText}>Todavía no se envió ninguna notificación.</p>
        ) : (
          <table style={table} className={styles.table}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Título</th>
                <th style={th}>Mensaje</th>
                <th style={th}>Enviado por</th>
                <th style={th}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {history.map((n) => (
                <tr key={n.id}>
                  <td style={td} data-label="Fecha">
                    {new Date(n.created_at).toLocaleString("es-AR", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td style={td} data-label="Título">{n.title}</td>
                  <td style={{ ...td, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} data-label="Mensaje">{n.body}</td>
                  <td style={td} data-label="Enviado por">{n.sent_by_name ?? "—"}</td>
                  <td style={td} data-label="Resultado">
                    {n.success_count}/{n.recipient_count} entregadas
                    {n.failure_count > 0 ? ` (${n.failure_count} fallidas)` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const statsRow: React.CSSProperties = { display: "flex", gap: "1rem", flexWrap: "wrap" };
const statCard: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", minWidth: 180,
};
const statValue: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 800, color: "#111" };
const statLabel: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 };

const historyWrap: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.5rem", overflowX: "auto" };
const historyTitle: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" };
const emptyText: React.CSSProperties = { fontSize: "0.85rem", color: "#6b7280" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" };
const th: React.CSSProperties = { textAlign: "left", padding: "0.5rem 0.75rem", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "0.6rem 0.75rem", borderBottom: "1px solid #f3f4f6", color: "#111" };
