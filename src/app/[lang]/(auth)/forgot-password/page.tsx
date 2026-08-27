import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getAuthBackgroundImages } from "@/lib/authBackgroundImages";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  params,
}: {
  params: { lang: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const [t, backgroundImages] = await Promise.all([
    getDictionary(lang),
    getAuthBackgroundImages(),
  ]);

  return <ForgotPasswordForm t={t.auth.forgotPassword} lang={lang} backgroundImages={backgroundImages} />;
}
