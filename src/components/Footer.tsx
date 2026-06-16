import Link from "next/link";
import { getDictionary, type Locale } from "@/i18n";

type Props = { lang: Locale };

export default async function Footer({ lang }: Props) {
  const t = await getDictionary(lang);
  const year = new Date().getFullYear();

  return (
    <footer style={footer}>
      <div style={inner}>
        <div style={left}>
          <Link href={`/${lang}`} style={brand}>IAD Capital</Link>
          <p style={tagline}>{t.footer.tagline}</p>
        </div>
        <p style={copy}>© {year} IAD Capital. {t.footer.rights}</p>
      </div>
    </footer>
  );
}

const footer: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  background: "#fff",
  marginTop: "auto",
};
const inner: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "2rem 1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "1rem",
};
const left: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.25rem" };
const brand: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "1rem",
  color: "#111",
  textDecoration: "none",
  letterSpacing: "-0.03em",
};
const tagline: React.CSSProperties = { fontSize: "0.8rem", color: "#9ca3af" };
const copy: React.CSSProperties = { fontSize: "0.8rem", color: "#9ca3af" };
