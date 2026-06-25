import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import UnitForm, { type Initial as UnitInitial } from "@/components/admin/UnitForm";

export default async function EditUnitPage({
  params,
}: {
  params: { lang: string; id: string; unitId: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  const [[dev], [unit], unitImageRows] = await Promise.all([
    db`SELECT id, name, images FROM developments WHERE id = ${params.id}`,
    db<UnitInitial[]>`SELECT * FROM units WHERE id = ${params.unitId} AND development_id = ${params.id}`,
    db<{ images: string[] }[]>`SELECT images FROM units WHERE development_id = ${params.id}`,
  ]);
  if (!dev || !unit) notFound();

  const existingImages = Array.from(
    new Set([...(dev.images ?? []), ...unitImageRows.flatMap((u) => u.images ?? [])])
  );

  return (
    <UnitForm
      t={t.admin.units}
      lang={lang}
      developmentId={params.id}
      developmentName={dev.name}
      initial={unit}
      existingImages={existingImages}
    />
  );
}
