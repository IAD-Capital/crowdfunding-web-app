import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDictionary, type Locale } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";

type Props = { lang: Locale };

export default async function Header({ lang }: Props) {
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);

  return (
    <header style={header}>
      <div style={inner}>
        {/* Brand */}
        <Link href={`/${lang}`} style={brand}>IAD Capital</Link>

        {/* Right side */}
        <div style={right}>
          <LanguageSwitcher currentLang={lang} />

          {session ? (
            <>
              {session.role === "admin" && (
                <Link href={`/${lang}/admin`} style={navLink}>
                  {t.header.admin}
                </Link>
              )}
              <span style={userLabel}>{session.fullName}</span>
              <LogoutButton label={t.auth.logout} />
            </>
          ) : (
            <>
              <Link href={`/${lang}/login`} style={navLink}>{t.header.signIn}</Link>
              <Link href={`/${lang}/signup`} style={btnOutline}>{t.header.signUp}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const header: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
};
const inner: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 1.5rem",
  height: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const brand: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "1.2rem",
  color: "#111",
  textDecoration: "none",
  letterSpacing: "-0.03em",
};
const right: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};
const navLink: React.CSSProperties = {
  color: "#374151",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: 500,
};
const btnOutline: React.CSSProperties = {
  padding: "0.4rem 0.9rem",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  color: "#111",
  textDecoration: "none",
  fontSize: "0.875rem",
  fontWeight: 600,
};
const userLabel: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "#6b7280",
};
