import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import Link from "next/link";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={sidebar}>
        <div style={logo}>Admin</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <Link href={`/${lang}/admin/developments`} style={navLink}>
            {t.admin.nav.developments}
          </Link>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: "2rem", background: "#f9fafb", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  );
}

const sidebar: React.CSSProperties = {
  width: 220,
  background: "#111",
  color: "#fff",
  padding: "1.5rem 1rem",
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
  flexShrink: 0,
};
const logo: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "#fff",
  letterSpacing: "0.05em",
};
const navLink: React.CSSProperties = {
  color: "#d1d5db",
  textDecoration: "none",
  padding: "0.5rem 0.75rem",
  borderRadius: 6,
  fontSize: "0.9rem",
};
