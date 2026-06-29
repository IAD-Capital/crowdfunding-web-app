import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDictionary, type Locale } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";
import NotificationBell, { type Notification } from "./NotificationBell";
import ScrollHeader from "./ScrollHeader";
import DevelopmentsMenu from "./DevelopmentsMenu";
import MobileMenu from "./MobileMenu";
import db from "@/lib/db";
import s from "./Header.module.scss";

type Props = { lang: Locale };

type NavDevelopment = { id: number; name: string; address: string; image: string | null };

export default async function Header({ lang }: Props) {
  const [session, t, devRows] = await Promise.all([
    getSession(),
    getDictionary(lang),
    db<{ id: number; name: string; address: string; images: string[] }[]>`
      SELECT id, name, address, images FROM developments
      WHERE status = 'active' AND visible = true
      ORDER BY created_at DESC
      LIMIT 8
    `,
  ]);

  const navDevelopments: NavDevelopment[] = devRows.map((d) => ({
    id: d.id,
    name: d.name,
    address: d.address,
    image: d.images?.[0] ?? null,
  }));

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
    <ScrollHeader>
      <div className={s.inner}>
        <Link href={`/${lang}`} className={s.brand}>IAD Capital</Link>

        <nav className={s.centerNav}>
          <DevelopmentsMenu developments={navDevelopments} lang={lang} />
        </nav>

        <div className={s.right}>
          <LanguageSwitcher currentLang={lang} />

          {session ? (
            <>
              {session.role !== "superadmin" && (
                <Link href={`/${lang}/wallet`} className={s.navLink}>
                  💼 Mi cartera
                </Link>
              )}
              {session.role === "superadmin" && (
                <Link href={`/${lang}/admin`} className={s.navLink}>
                  {t.header.admin}
                </Link>
              )}
              {session.role === "investor" && (
                <NotificationBell notifications={notifications} dark={false} />
              )}
              <span className={s.userLabel}>{session.fullName}</span>
              <LogoutButton label={t.auth.logout} />
            </>
          ) : (
            <>
              <Link href={`/${lang}/login`} className={s.navLink}>{t.header.signIn}</Link>
              <Link href={`/${lang}/signup`} className={s.btnOutline}>{t.header.signUp}</Link>
            </>
          )}
        </div>

        <MobileMenu
          lang={lang}
          session={session}
          notifications={notifications}
          labels={{ admin: t.header.admin, signIn: t.header.signIn, signUp: t.header.signUp, logout: t.auth.logout }}
        />
      </div>
    </ScrollHeader>
  );
}
