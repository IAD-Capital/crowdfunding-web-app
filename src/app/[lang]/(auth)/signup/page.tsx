import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getAuthBackgroundImages } from "@/lib/authBackgroundImages";
import SignupForm from "@/components/SignupForm";

export default async function SignupPage({
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

  return (
    <SignupForm
      t={t.auth.signup}
      tGoogle={t.auth.google}
      lang={lang}
      next={searchParams.next}
      backgroundImages={backgroundImages}
    />
  );
}
