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

  const [[dev], [unit], priceHistory] = await Promise.all([
    db`SELECT id, name, images, interior_images, plan_images FROM developments WHERE id = ${params.id}`,
    db<UnitInitial[]>`SELECT * FROM units WHERE id = ${params.unitId} AND development_id = ${params.id}`,
    db<PriceHistoryEntry[]>`SELECT * FROM unit_price_history WHERE unit_id = ${params.unitId} ORDER BY effective_date ASC, id ASC`,
  ]);
  if (!dev || !unit) notFound();

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
      <UnitPriceHistoryManager unitId={unit.id} initial={priceHistory} />
    </>
  );
}
