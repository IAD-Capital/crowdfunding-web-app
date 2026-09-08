import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import UnitForm, { type Initial as UnitInitial } from "@/components/admin/UnitForm";
import UnitPriceHistoryManager, { type PriceHistoryEntry } from "@/components/admin/UnitPriceHistoryManager";

export default async function EditUnitPage({
  params,
}: {
  params: { lang: string; id: string; unitId: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  const [[dev], [unit], priceHistoryRows] = await Promise.all([
    db`SELECT id, name, images, interior_images, plan_images FROM developments WHERE id = ${params.id}`,
    db<UnitInitial[]>`SELECT * FROM units WHERE id = ${params.unitId} AND development_id = ${params.id}`,
    db<PriceHistoryEntry[]>`SELECT * FROM unit_price_history WHERE unit_id = ${params.unitId} ORDER BY effective_date ASC, id ASC`,
  ]);
  if (!dev || !unit) notFound();

  // postgres.js parses DATE columns into JS Date objects — normalize to a plain
  // "yyyy-mm-dd" string here so the client component always gets a real string,
  // matching PriceHistoryEntry's declared type (Date objects don't survive
  // round-tripping through the manager's fetch-based add/edit calls, which get
  // plain JSON strings back from the API instead).
  const priceHistory = priceHistoryRows.map((row) => ({
    ...row,
    effective_date: new Date(row.effective_date).toISOString().slice(0, 10),
  }));

  return (
    <>
      <UnitForm
        t={t.admin.units}
        lang={lang}
        developmentId={params.id}
        developmentName={dev.name}
        initial={unit}
        developmentImages={dev.images ?? []}
        developmentInteriorImages={dev.interior_images ?? []}
        developmentPlanImages={dev.plan_images ?? []}
      />
      <UnitPriceHistoryManager
        unitId={unit.id}
        initial={priceHistory}
        unitTotalM2={unit.total_m2 ?? null}
        unitCoveredM2={unit.covered_m2 ?? null}
        unitSemiCoveredM2={unit.semi_covered_m2 ?? null}
        unitUncoveredM2={unit.uncovered_m2 ?? null}
      />
    </>
  );
}
