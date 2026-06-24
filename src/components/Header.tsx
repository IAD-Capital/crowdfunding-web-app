import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { getDictionary, type Locale } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";
import NotificationBell, { type Notification } from "./NotificationBell";
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
      WHERE status = 'active'
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
    <header className={s.header}>
      <div className={s.inner}>
        <Link href={`/${lang}`} className={s.brand}>IAD Capital</Link>

        <nav className={s.centerNav}>
          {navDevelopments.length > 0 && (
            <div className={s.navItem}>
              <Link href={`/${lang}#catalogo`} className={`${s.navLink} ${s.navTrigger}`}>
                Emprendimientos
                <svg className={s.chevron} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Link>

              <div className={s.megaMenu}>
                <div className={s.megaMenuInner}>
                  <div className={s.megaMenuGrid}>
                    {navDevelopments.map((d) => (
                      <Link key={d.id} href={`/${lang}/emprendimientos/${d.id}`} className={s.megaItem}>
                        <div className={s.megaItemImage}>
                          {d.image ? (
                            <Image src={d.image} alt={d.name} fill style={{ objectFit: "cover" }} />
                          ) : (
                            <div className={s.megaItemPlaceholder} />
                          )}
                        </div>
                        <div className={s.megaItemBody}>
                          <span className={s.megaItemName}>{d.name}</span>
                          <span className={s.megaItemAddr}>{d.address}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/${lang}#catalogo`} className={s.megaFooterLink}>
                    Ver todos los emprendimientos →
                  </Link>
                </div>
              </div>
            </div>
          )}
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
      </div>
    </header>
  );
}
