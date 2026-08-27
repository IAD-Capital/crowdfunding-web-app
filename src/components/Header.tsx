import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/session";
import { getDictionary, type Locale } from "@/i18n";
import UserMenu from "./UserMenu";
import NotificationBell, { type Notification } from "./NotificationBell";
import ScrollHeader from "./ScrollHeader";
import DevelopmentsMenu from "./DevelopmentsMenu";
import MobileMenu from "./MobileMenu";
import type { FeaturedProperty } from "./MobileFeaturedCarousel";
import db from "@/lib/db";
import s from "./Header.module.scss";

type Props = { lang: Locale };

export default async function Header({ lang }: Props) {
  const [session, t, featuredUnitRows] = await Promise.all([
    getSession(),
    getDictionary(lang),
    db<{
      id: number; images: string[]; price_usd: string | number;
      development_name: string; development_address: string;
      development_slug: string | null; development_id: number;
    }[]>`
      SELECT u.id, u.images, u.price_usd,
        d.name AS development_name, d.address AS development_address,
        d.slug AS development_slug, d.id AS development_id
      FROM units u
      JOIN developments d ON d.id = u.development_id
      WHERE u.featured = true AND d.status = 'active' AND d.visible = true AND u.status != 'sold'
      ORDER BY u.featured_order
      LIMIT 8
    `,
  ]);

  const featuredProperties: FeaturedProperty[] = featuredUnitRows.map((u) => ({
    id: u.id,
    image: u.images?.[0] ?? null,
    price_usd: Number(u.price_usd),
    development_name: u.development_name,
    development_address: u.development_address,
    development_slug: u.development_slug,
    development_id: u.development_id,
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
        <Link href={`/${lang}`} className={s.brand}>
          <Image src="/iad-logo.svg" alt="IAD Capital" width={449} height={226} className={s.logo} priority />
        </Link>

        <nav className={s.centerNav}>
          <DevelopmentsMenu properties={featuredProperties} lang={lang} />
        </nav>

        <div className={s.right}>
          <Link href={`/${lang}/como-invertir`} className={s.btnCta}>
            Quiero invertir
          </Link>
          {session ? (
            <>
              {session.role === "investor" && (
                <NotificationBell notifications={notifications} dark={false} />
              )}
              <UserMenu lang={lang} session={session} adminLabel={t.header.admin} logoutLabel={t.auth.logout} />
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
          featuredProperties={featuredProperties}
          labels={{ admin: t.header.admin, signIn: t.header.signIn, signUp: t.header.signUp, logout: t.auth.logout }}
        />
      </div>
    </ScrollHeader>
  );
}
