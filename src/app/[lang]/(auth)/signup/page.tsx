import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import SignupForm from "@/components/SignupForm";

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { next?: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  return <SignupForm t={t.auth.signup} lang={lang} next={searchParams.next} />;
}
