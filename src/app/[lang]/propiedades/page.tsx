import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import PublicShell from "@/components/PublicShell";
import CatalogSection, { type Development, type Unit } from "@/components/CatalogSection";
import db from "@/lib/db";

type DevRow = Omit<Development, "unit_count"> & { unit_count: number; completion_date: Date | string | null };
type UnitRow = Omit<Unit, "price_usd" | "current_price_usd" | "available_pct" | "group_expires_at"> & {
  price_usd: number | string;
  current_price_usd: number | string | null;
  available_pct: number | string;
  group_expires_at: Date | string | null;
};

export default async function PropiedadesPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();
  const isInvestor = session?.role === "investor";

  const [[phoneRow], developments, units, investedRows, favoriteRows] = await Promise.all([
    isInvestor
      ? db<{ phone: string | null }[]>`SELECT phone FROM users WHERE id = ${Number(session!.sub)}`
      : Promise.resolve([null]),
    db<DevRow[]>`
      SELECT d.id, d.name, d.address, d.description, d.status,
             d.completion_date, d.amenities, d.images, d.slug,
             d.developer_id, dv.name AS developer_name,
             COUNT(u.id)::int AS unit_count
      FROM developments d
      LEFT JOIN units u ON u.development_id = d.id
      LEFT JOIN developers dv ON dv.id = d.developer_id
      WHERE d.status = 'active' AND d.visible = true
      GROUP BY d.id, dv.name
      ORDER BY d.updated_at DESC
    `,
    db<UnitRow[]>`
      SELECT u.id, u.development_id, u.identifier, u.floor,
             u.total_m2, u.covered_m2, u.rooms, u.bedrooms,
             u.orientation, u.price_usd, u.current_price_usd, u.status, u.images, u.description,
             100 - COALESCE((
               SELECT SUM(percentage) FROM investments
               WHERE unit_id = u.id AND status = 'approved'
             ), 0) AS available_pct,
             CASE WHEN u.group_duration_months IS NOT NULL THEN
               (SELECT MIN(i2.created_at) + (u.group_duration_months || ' months')::interval
                FROM investments i2 WHERE i2.unit_id = u.id AND i2.status = 'approved')
             ELSE NULL END AS group_expires_at
      FROM units u
      JOIN developments d ON d.id = u.development_id
      WHERE d.status = 'active' AND d.visible = true
      ORDER BY u.updated_at DESC
    `,
    isInvestor
      ? db`
          SELECT DISTINCT unit_id FROM investments
          WHERE user_id = ${Number(session!.sub)} AND status IN ('pending', 'approved')
        `
      : Promise.resolve([]),
    session
      ? db`SELECT unit_id FROM favorites WHERE user_id = ${Number(session.sub)}`
      : Promise.resolve([]),
  ]);

  const hasPhone = !!phoneRow?.phone?.trim();
  const myInvestedUnitIds: number[] = investedRows.map((r) => Number(r.unit_id));
  const myFavoriteUnitIds: number[] = favoriteRows.map((r) => Number(r.unit_id));

  const serializedDevelopments = developments.map((d) => ({
    ...d,
    completion_date: d.completion_date ? new Date(d.completion_date).toISOString() : null,
  }));
  const serializedUnits = units.map((u) => ({
    ...u,
    price_usd: u.price_usd != null ? Number(u.price_usd) : null,
    current_price_usd: u.current_price_usd != null ? Number(u.current_price_usd) : null,
    available_pct: Number(u.available_pct),
    group_expires_at: u.group_expires_at ? new Date(u.group_expires_at as string).toISOString() : null,
  }));

  return (
    <PublicShell lang={lang}>
      <CatalogSection
        developments={serializedDevelopments as Parameters<typeof CatalogSection>[0]["developments"]}
        units={serializedUnits as Parameters<typeof CatalogSection>[0]["units"]}
        isInvestor={isInvestor}
        hasPhone={hasPhone}
        myInvestedUnitIds={myInvestedUnitIds}
        isAuthenticated={!!session}
        myFavoriteUnitIds={myFavoriteUnitIds}
        lang={lang}
      />
    </PublicShell>
  );
}
