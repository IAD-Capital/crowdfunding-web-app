import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { MobileSidebarProvider } from "@/components/admin/MobileSidebarContext";
import { getSession } from "@/lib/session";
import { getAdminAlerts } from "@/lib/adminAlerts";
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
    notifications = await getAdminAlerts(lang);
  }

  return (
    <MobileSidebarProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f4f6fb" }}>
        <AdminSidebar lang={lang} notifications={notifications} />

        {/* Main area — offset by sidebar width (handled via CSS var) */}
        <div style={mainArea} className="admin-main-area">
          <AdminTopbar
            lang={lang}
            userEmail={session?.email ?? ""}
            userName={session?.fullName ?? session?.email ?? ""}
            userAvatar={session?.avatar ?? null}
          />
          <main style={content} className="admin-content">
            {children}
          </main>
        </div>

        <style>{`
          :root { --sidebar-w: 240px; }
          @media (max-width: 768px) {
            .admin-main-area { margin-left: 0 !important; }
            .admin-content { padding: 1.25rem 1rem !important; }
          }
        `}</style>
      </div>
    </MobileSidebarProvider>
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
