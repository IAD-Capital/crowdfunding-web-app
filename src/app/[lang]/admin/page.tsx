import { redirect } from "next/navigation";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";

export default function AdminPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  redirect(`/${lang}/admin/developments`);
}
