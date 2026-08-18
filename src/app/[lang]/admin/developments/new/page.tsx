import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import DevelopmentForm from "@/components/admin/DevelopmentForm";

export default async function NewDevelopmentPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  const allDevelopers = await db<{ id: number; name: string }[]>`SELECT id, name FROM developers ORDER BY name`;

  return <DevelopmentForm t={t.admin.developments} lang={lang} allDevelopers={allDevelopers} />;
}
