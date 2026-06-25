import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import { notFound } from "next/navigation";
import DevelopmentForm from "@/components/admin/DevelopmentForm";

export default async function EditDevelopmentPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  const [dev] = await db`SELECT * FROM developments WHERE id = ${params.id}`;
  if (!dev) notFound();

  const unitImageRows = await db<{ images: string[] }[]>`
    SELECT images FROM units WHERE development_id = ${params.id}
  `;
  const existingImages = Array.from(
    new Set([...(dev.images ?? []), ...unitImageRows.flatMap((u) => u.images ?? [])])
  );

  return (
    <DevelopmentForm
      t={t.admin.developments}
      lang={lang}
      initial={dev as any}
      existingImages={existingImages}
    />
  );
}
