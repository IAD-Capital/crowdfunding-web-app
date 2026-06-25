import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import UnitForm from "@/components/admin/UnitForm";

export default async function NewUnitPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  const [dev] = await db`SELECT id, name, images FROM developments WHERE id = ${params.id}`;
  if (!dev) notFound();

  const unitImageRows = await db<{ images: string[] }[]>`
    SELECT images FROM units WHERE development_id = ${params.id}
  `;
  const existingImages = Array.from(
    new Set([...(dev.images ?? []), ...unitImageRows.flatMap((u) => u.images ?? [])])
  );

  return (
    <UnitForm
      t={t.admin.units}
      lang={lang}
      developmentId={params.id}
      developmentName={dev.name}
      existingImages={existingImages}
    />
  );
}
