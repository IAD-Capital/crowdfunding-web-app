import Link from "next/link";
import { getSession } from "@/lib/session";
import { getDictionary, type Locale } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import LogoutButton from "./LogoutButton";

type Props = { lang: Locale };

export default async function AdminHeader({ lang }: Props) {
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);
  return (
    <header style={header}>
      <div style={inner}>
        {/* Brand */}
        <div style={brandGroup}>
          <Link href={`/${lang}`} style={brand}>IAD Capital</Link>
          <span style={adminBadge}>Admin</span>
        </div>

        {/* Nav */}
        <nav style={nav}>
          <Link href={`/${lang}/admin/developments`} style={navLink}>
            {t.admin.nav.developments}
          </Link>
          <Link href={`/${lang}/admin/units`} style={navLink}>
            {t.admin.nav.units}
          </Link>
          <Link href={`/${lang}/admin/users`} style={navLink}>
            {t.admin.nav.users}
          </Link>
        </nav>

        {/* Right */}
        <div style={right}>
          <LanguageSwitcher currentLang={lang} />
          {session && (
            <>
              <span style={userLabel}>{session.email}</span>
              <LogoutButton label={t.auth.logout} />
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
  background: "#111",
  color: "#fff",
};
const inner: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "0 1.5rem",
  height: 60,
  display: "flex",
  alignItems: "center",
  gap: "2rem",
};
const brandGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
  flexShrink: 0,
};
const brand: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "1.2rem",
  color: "#fff",
  textDecoration: "none",
  letterSpacing: "-0.03em",
};
const adminBadge: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 700,
  background: "#374151",
  color: "#d1d5db",
  padding: "0.15rem 0.5rem",
  borderRadius: 4,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};
const nav: React.CSSProperties = {
  display: "flex",
  gap: "0.25rem",
  flex: 1,
};
const navLink: React.CSSProperties = {
  color: "#d1d5db",
  textDecoration: "none",
  fontSize: "0.9rem",
  fontWeight: 500,
  padding: "0.35rem 0.75rem",
  borderRadius: 6,
};
const right: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginLeft: "auto",
  flexShrink: 0,
};
const userLabel: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#9ca3af",
};
