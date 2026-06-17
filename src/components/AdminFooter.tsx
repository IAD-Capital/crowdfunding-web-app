import Link from "next/link";
import { getDictionary, type Locale } from "@/i18n";
import { getSession } from "@/lib/session";

type Props = { lang: Locale };

export default async function AdminFooter({ lang }: Props) {
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);
  const year = new Date().getFullYear();
  const isSuperAdmin = session?.role === "superadmin";

  const sections = [
    {
      label: t.admin.nav.developments,
      href: `/${lang}/admin/developments`,
    },
    {
      label: t.admin.nav.units,
      href: `/${lang}/admin/units`,
    },
    ...(isSuperAdmin ? [{
      label: t.admin.nav.users,
      href: `/${lang}/admin/users`,
    }] : []),
  ];

  return (
    <footer style={footer}>
      <div style={inner}>
        {/* Left: brand + tagline */}
        <div style={brandCol}>
          <span style={brand}>IAD Capital</span>
          <span style={badge}>Admin</span>
          <p style={tagline}>Panel de administración</p>
        </div>

        {/* Center: nav sections as a row of labeled links */}
        <div style={navGrid}>
          {sections.map((s) => (
            <div key={s.href} style={navItem}>
              <Link href={s.href} style={navLink}>{s.label}</Link>
            </div>
          ))}
        </div>

        {/* Right: copy */}
        <p style={copy}>© {year} IAD Capital</p>
      </div>
    </footer>
  );
}

const footer: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  background: "#f9fafb",
};
const inner: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "1.5rem 1.5rem",
  display: "flex",
  alignItems: "center",
  gap: "3rem",
  flexWrap: "wrap",
};
const brandCol: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  flexShrink: 0,
};
const brand: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "0.95rem",
  color: "#111",
  letterSpacing: "-0.03em",
};
const badge: React.CSSProperties = {
  fontSize: "0.65rem",
  fontWeight: 700,
  background: "#e5e7eb",
  color: "#374151",
  padding: "0.1rem 0.4rem",
  borderRadius: 4,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};
const tagline: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "#9ca3af",
  marginLeft: "0.25rem",
};
const navGrid: React.CSSProperties = {
  display: "flex",
  gap: "0.25rem",
  flex: 1,
};
const navItem: React.CSSProperties = {
  padding: "0 0.5rem",
  borderLeft: "1px solid #e5e7eb",
};
const navLink: React.CSSProperties = {
  color: "#6b7280",
  textDecoration: "none",
  fontSize: "0.85rem",
  fontWeight: 500,
};
const copy: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "#9ca3af",
  marginLeft: "auto",
  flexShrink: 0,
};
