import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDictionary, type Locale } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";
import NotificationBell, { type Notification } from "./NotificationBell";
import db from "@/lib/db";

type Props = { lang: Locale };

export default async function Header({ lang }: Props) {
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);

  let notifications: Notification[] = [];
  if (session?.role === "investor") {
    const rows = await db`
      SELECT
        i.id, i.removal_requested_at, i.status,
        u.identifier,
        d.name AS development_name
      FROM investments i
      JOIN units u ON u.id = i.unit_id
      JOIN developments d ON d.id = u.development_id
      WHERE i.user_id = ${Number(session.sub)}
        AND i.removal_requested_at IS NOT NULL
        AND i.removal_ack_at IS NULL
      ORDER BY i.removal_requested_at ASC
    `;
    notifications = rows.map((r) => {
      const approved = r.status === "cancelled";
      return {
        id: String(r.id),
        title: approved ? "Inversión removida" : "Remoción pendiente de aprobación",
        body: approved
          ? `Tu inversión en ${r.identifier} (${r.development_name}) fue removida por el administrador.`
          : `Tu solicitud para remover la inversión en ${r.identifier} (${r.development_name}) está esperando aprobación.`,
        href: `/${lang}/wallet`,
        timestamp: new Date(r.removal_requested_at as string).toISOString(),
        variant: (approved ? "success" : "pending") as "success" | "pending",
        ackUrl: approved ? `/api/investments/${r.id}/ack` : undefined,
      };
    });
  }

  return (
    <header style={header}>
      <div style={inner}>
        {/* Brand */}
        <Link href={`/${lang}`} style={brand}>IAD Capital</Link>

        {/* Right side */}
        <div style={right}>
          <LanguageSwitcher currentLang={lang} />

          {session ? (
            <>
              {session.role !== "superadmin" && (
                <Link href={`/${lang}/wallet`} style={navLink}>
                  💼 Mi cartera
                </Link>
              )}
              {session.role === "superadmin" && (
                <Link href={`/${lang}/admin`} style={navLink}>
                  {t.header.admin}
                </Link>
              )}
              {session.role === "investor" && (
                <NotificationBell notifications={notifications} dark={false} />
              )}
              <span style={userLabel}>{session.fullName}</span>
              <LogoutButton label={t.auth.logout} />
            </>
          ) : (
            <>
              <Link href={`/${lang}/login`} style={navLink}>{t.header.signIn}</Link>
              <Link href={`/${lang}/signup`} style={btnOutline}>{t.header.signUp}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const header: React.CSSProperties = {
  position: "sticky", top: 0, zIndex: 50,
  background: "#fff", borderBottom: "1px solid #e5e7eb",
};
const inner: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem",
  height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
};
const brand: React.CSSProperties = { fontWeight: 800, fontSize: "1.2rem", color: "#111", textDecoration: "none", letterSpacing: "-0.03em" };
const right: React.CSSProperties = { display: "flex", alignItems: "center", gap: "1rem" };
const navLink: React.CSSProperties = { color: "#374151", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 };
const btnOutline: React.CSSProperties = {
  padding: "0.4rem 0.9rem", border: "1px solid #d1d5db", borderRadius: 8,
  color: "#111", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600,
};
const userLabel: React.CSSProperties = { fontSize: "0.875rem", color: "#6b7280" };
