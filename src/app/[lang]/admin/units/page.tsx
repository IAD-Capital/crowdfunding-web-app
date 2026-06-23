import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import UnitsView, { type UnitRow } from "@/components/admin/UnitsView";

export default async function UnitsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);
  const tu = t.admin.units;

  const rows = await db<UnitRow[]>`
    SELECT u.*, d.name AS development_name, d.id AS development_id
    FROM units u
    JOIN developments d ON d.id = u.development_id
    ORDER BY d.name, u.floor, u.identifier
  `;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>{tu.title}</h1>

      {rows.length === 0 ? (
        <p style={{ color: "#6b7280" }}>{tu.empty}</p>
      ) : (
        <UnitsView
          units={rows}
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
