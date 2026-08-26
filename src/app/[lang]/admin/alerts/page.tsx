import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { redirect } from "next/navigation";
import { getAdminAlerts } from "@/lib/adminAlerts";
import AlertsView from "@/components/admin/AlertsView";

export default async function AdminAlertsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const { error } = await requireSuperAdmin();
  if (error) redirect(`/${lang}/login`);

  const notifications = await getAdminAlerts(lang);

  return (
    <div style={wrap}>
      <div>
        <h1 style={title}>Alertas</h1>
        <p style={sub}>Solicitudes pendientes de revisión</p>
      </div>
      <AlertsView notifications={notifications} />
    </div>
  );
}

const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.25rem" };
const title: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, margin: 0 };
const sub: React.CSSProperties = { color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.9rem" };
