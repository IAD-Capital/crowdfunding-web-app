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

  return <DevelopmentForm t={t.admin.developments} lang={lang} initial={dev as any} />;
}
