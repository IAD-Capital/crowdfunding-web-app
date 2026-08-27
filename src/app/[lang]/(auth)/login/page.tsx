import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getAuthBackgroundImages } from "@/lib/authBackgroundImages";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { next?: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const [t, backgroundImages] = await Promise.all([
    getDictionary(lang),
    getAuthBackgroundImages(),
  ]);

  return <LoginForm t={t.auth.login} lang={lang} next={searchParams.next} backgroundImages={backgroundImages} />;
}
