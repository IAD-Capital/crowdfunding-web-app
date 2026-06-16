import { getSession } from "@/lib/session";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import LogoutButton from "@/components/LogoutButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Link from "next/link";

export default async function Home({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);

  return (
    <main style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <LanguageSwitcher currentLang={lang} />
      </div>

      <h1>{t.home.welcome}{session ? `, ${session.fullName}` : ""}</h1>

      {session ? (
        <>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>
            {session.email} &mdash; <strong>{session.role}</strong>
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <LogoutButton label={t.auth.logout} />
          </div>
        </>
      ) : (
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>
          <Link href={`/${lang}/login`} style={{ color: "#111", fontWeight: 600 }}>
            {t.home.signIn}
          </Link>
          {" "}{t.home.or}{" "}
          <Link href={`/${lang}/signup`} style={{ color: "#111", fontWeight: 600 }}>
            {t.home.createAccount}
          </Link>.
        </p>
      )}
    </main>
  );
}
