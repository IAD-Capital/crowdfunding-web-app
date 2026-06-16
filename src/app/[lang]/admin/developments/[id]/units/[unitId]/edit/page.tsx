import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import UnitForm from "@/components/admin/UnitForm";

export default async function EditUnitPage({
  params,
}: {
  params: { lang: string; id: string; unitId: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  const [[dev], [unit]] = await Promise.all([
    db`SELECT id, name FROM developments WHERE id = ${params.id}`,
    db`SELECT * FROM units WHERE id = ${params.unitId} AND development_id = ${params.id}`,
  ]);
  if (!dev || !unit) notFound();

  return (
    <UnitForm
      t={t.admin.units}
      lang={lang}
      developmentId={params.id}
      developmentName={dev.name}
      initial={unit}
    />
  );
}
