import { getSession } from "@/lib/session";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import PublicShell from "@/components/PublicShell";
import Link from "next/link";

export default async function Home({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);

  return (
    <PublicShell lang={lang}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "4rem 1.5rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
          {t.home.welcome}{session ? `, ${session.fullName}` : ""}
        </h1>

        {!session && (
          <p style={{ marginTop: "1rem", color: "#6b7280", fontSize: "1.1rem" }}>
            <Link href={`/${lang}/login`} style={{ color: "#111", fontWeight: 600 }}>
              {t.home.signIn}
            </Link>
            {" "}{t.home.or}{" "}
            <Link href={`/${lang}/signup`} style={{ color: "#111", fontWeight: 600 }}>
              {t.home.createAccount}
            </Link>.
          </p>
        )}
      </div>
    </PublicShell>
  );
}
