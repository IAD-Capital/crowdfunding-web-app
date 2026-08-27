import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getAuthBackgroundImages } from "@/lib/authBackgroundImages";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { token?: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const [t, backgroundImages] = await Promise.all([
    getDictionary(lang),
    getAuthBackgroundImages(),
  ]);

  return <ResetPasswordForm t={t.auth.resetPassword} lang={lang} token={searchParams.token} backgroundImages={backgroundImages} />;
}
