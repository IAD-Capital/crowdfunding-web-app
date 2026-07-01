import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import UnitsView, { type UnitRow } from "@/components/admin/UnitsView";

export default async function UnitsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);
  const tu = t.admin.units;

  const rows = await db<UnitRow[]>`
    SELECT u.*, d.name AS development_name, d.id AS development_id,
           COALESCE(inv.investment_ids, '{}') AS investment_ids
    FROM units u
    JOIN developments d ON d.id = u.development_id
    LEFT JOIN (
      SELECT unit_id, array_agg(id ORDER BY id) AS investment_ids
      FROM investments
      WHERE status IN ('pending', 'approved')
      GROUP BY unit_id
    ) inv ON inv.unit_id = u.id
    ORDER BY u.updated_at DESC
  `;

  const units = rows.map((u) => ({
    ...u,
    created_at: u.created_at ? new Date(u.created_at as unknown as string).toISOString() : undefined,
    updated_at: u.updated_at ? new Date(u.updated_at as unknown as string).toISOString() : undefined,
  }));

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>{tu.title}</h1>

      {rows.length === 0 ? (
        <p style={{ color: "#6b7280" }}>{tu.empty}</p>
      ) : (
        <UnitsView
          units={units}
          lang={lang}
          statusT={tu.status as { available: string; partial: string; sold: string }}
          priceLabel={tu.form.priceUsd}
          floorLabel={tu.form.floor}
          roomsLabel={tu.form.rooms}
          showDevelopment
          developmentLabel={t.admin.developments.title}
        />
      )}
    </div>
  );
}
