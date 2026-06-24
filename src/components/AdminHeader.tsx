import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDictionary, type Locale } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";
import NotificationBell, { type Notification } from "./NotificationBell";
import db from "@/lib/db";
import s from "./AdminHeader.module.scss";

type Props = { lang: Locale };

export default async function AdminHeader({ lang }: Props) {
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);

  let notifications: Notification[] = [];
  if (session?.role === "superadmin") {
    const rows = await db`
      SELECT
        i.id, i.removal_requested_at,
        u.identifier,
        d.name AS development_name,
        usr.full_name
      FROM investments i
      JOIN units u ON u.id = i.unit_id
      JOIN developments d ON d.id = u.development_id
      JOIN users usr ON usr.id = i.user_id
      WHERE i.removal_requested_at IS NOT NULL AND i.status = 'active'
      ORDER BY i.removal_requested_at ASC
    `;
    notifications = rows.map((r) => ({
      id: String(r.id),
      title: "Solicitud de remoción",
      body: `${r.full_name} solicitó remover su inversión en ${r.identifier} (${r.development_name})`,
      href: `/${lang}/admin/investments`,
      timestamp: new Date(r.removal_requested_at as string).toISOString(),
      variant: "warning" as const,
      actions: [
        {
          label: "Aprobar",
          url: `/api/admin/investments/${r.id}`,
          method: "PUT" as const,
          body: { status: "cancelled" },
          variant: "danger" as const,
        },
        {
          label: "Rechazar",
          url: `/api/admin/investments/${r.id}`,
          method: "PUT" as const,
          body: { clear_removal_request: true },
          variant: "ghost" as const,
        },
      ],
    }));
  }

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <div className={s.brandGroup}>
          <Link href={`/${lang}`} className={s.brand}>IAD Capital</Link>
          <span className={s.adminBadge}>Admin</span>
        </div>

        <nav className={s.nav}>
          <Link href={`/${lang}/admin/developments`} className={s.navLink}>
            {t.admin.nav.developments}
          </Link>
          <Link href={`/${lang}/admin/units`} className={s.navLink}>
            {t.admin.nav.units}
          </Link>
          {session?.role === "superadmin" && (
            <>
              <Link href={`/${lang}/admin/investments`} className={s.navLink}>
                Inversiones
              </Link>
              <Link href={`/${lang}/admin/users`} className={s.navLink}>
                {t.admin.nav.users}
              </Link>
              <Link href={`/${lang}/admin/settings`} className={s.navLink}>
                Configuración
              </Link>
            </>
          )}
        </nav>

        <div className={s.right}>
          <LanguageSwitcher currentLang={lang} />
          {session?.role === "superadmin" && (
            <NotificationBell notifications={notifications} dark />
          )}
          {session && (
            <>
              <span className={s.userLabel}>{session.email}</span>
              <LogoutButton label={t.auth.logout} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
