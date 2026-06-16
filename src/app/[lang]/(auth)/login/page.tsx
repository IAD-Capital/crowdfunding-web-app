import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  return <LoginForm t={t.auth.login} lang={lang} />;
}
