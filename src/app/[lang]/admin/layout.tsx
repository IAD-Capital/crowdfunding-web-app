import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { getSession } from "@/lib/session";
import db from "@/lib/db";
import type { Notification } from "@/components/NotificationBell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();

  let notifications: Notification[] = [];
  if (session?.role === "superadmin") {
    const [removalRows, pendingRows] = await Promise.all([
      db`
        SELECT i.id, i.removal_requested_at,
          u.identifier, d.name AS development_name, usr.full_name
        FROM investments i
        JOIN units u ON u.id = i.unit_id
        JOIN developments d ON d.id = u.development_id
        JOIN users usr ON usr.id = i.user_id
        WHERE i.removal_requested_at IS NOT NULL AND i.status = 'approved'
        ORDER BY i.removal_requested_at ASC
      `,
      db`
        SELECT i.id, i.percentage, i.created_at,
          u.identifier, d.name AS development_name, usr.full_name
        FROM investments i
        JOIN units u ON u.id = i.unit_id
        JOIN developments d ON d.id = u.development_id
        JOIN users usr ON usr.id = i.user_id
        WHERE i.status = 'pending'
        ORDER BY i.created_at ASC
      `,
    ]);

    const pending: Notification[] = pendingRows.map((r) => ({
      id: `pending-${r.id}`,
      title: "Solicitud de inversión pendiente",
      body: `${r.full_name} quiere invertir ${Number(r.percentage)}% en ${r.identifier} (${r.development_name})`,
      href: `/${lang}/admin/investments`,
      timestamp: new Date(r.created_at as string).toISOString(),
      variant: "pending" as const,
      actions: [
        { label: "Aprobar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { status: "approved" }, variant: "primary" as const },
        { label: "Rechazar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { status: "rejected" }, variant: "ghost" as const },
      ],
    }));

    const removals: Notification[] = removalRows.map((r) => ({
      id: `removal-${r.id}`,
      title: "Solicitud de remoción",
      body: `${r.full_name} solicitó remover su inversión en ${r.identifier} (${r.development_name})`,
      href: `/${lang}/admin/investments`,
      timestamp: new Date(r.removal_requested_at as string).toISOString(),
      variant: "warning" as const,
      actions: [
        { label: "Aprobar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { status: "cancelled" }, variant: "danger" as const },
        { label: "Rechazar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { clear_removal_request: true }, variant: "ghost" as const },
      ],
    }));

    notifications = [...pending, ...removals];
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb" }}>
      <AdminSidebar lang={lang} notifications={notifications} />

      {/* Main area — offset by sidebar width (handled via CSS var) */}
      <div style={mainArea}>
        <AdminTopbar
          lang={lang}
          userEmail={session?.email ?? ""}
          userName={session?.fullName ?? session?.email ?? ""}
          userAvatar={session?.avatar ?? null}
        />
        <main style={content}>
          {children}
        </main>
      </div>

      {/* Overlay for collapsed sidebar on mobile — optional future enhancement */}
      <style>{`
        :root { --sidebar-w: 240px; }
        @media (max-width: 768px) { :root { --sidebar-w: 64px; } }
      `}</style>
    </div>
  );
}

const mainArea: React.CSSProperties = {
  flex: 1,
  marginLeft: "var(--sidebar-w, 240px)",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  transition: "margin-left 0.2s ease",
};

const content: React.CSSProperties = {
  flex: 1,
  padding: "2rem 2rem",
  maxWidth: 1300,
  width: "100%",
};
