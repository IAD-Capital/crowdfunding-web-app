import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import FeaturedUnitsManager, { type UnitOption } from "@/components/admin/FeaturedUnitsManager";

export default async function FeaturedUnitsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  const units = await db<UnitOption[]>`
    SELECT u.id, u.identifier, u.images, u.price_usd, u.total_m2, u.rooms,
           u.featured, u.featured_order,
           d.name AS development_name, d.address AS development_address
    FROM units u
    JOIN developments d ON d.id = u.development_id
    ORDER BY u.featured_order NULLS LAST, d.name, u.identifier
  `;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Unidades destacadas
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Elegí hasta 8 unidades y su orden — se muestran como hero en la home.
      </p>
      <FeaturedUnitsManager
        lang={lang}
        units={units.map((u) => ({ ...u, price_usd: Number(u.price_usd) }))}
      />
    </div>
  );
}
