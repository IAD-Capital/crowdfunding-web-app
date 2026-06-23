import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import DevelopmentsView, { type Development } from "@/components/admin/DevelopmentsView";

type Row = Omit<Development, "completion_date"> & { completion_date: Date | string | null };

export default async function DevelopmentsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);
  const td = t.admin.developments;

  const rows = await db<Row[]>`
    SELECT d.*, COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;

  // Serialize dates for client component
  const developments: Development[] = rows.map((d) => ({
    ...d,
    completion_date: d.completion_date ? new Date(d.completion_date).toISOString() : undefined,
  }));

  return (
    <DevelopmentsView
      developments={developments}
      lang={lang}
      t={{
        title: td.title,
        newDev: td.new,
        empty: td.empty,
        units: td.units,
        status: td.status as Record<string, string>,
      }}
    />
  );
}
