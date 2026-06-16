import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import Link from "next/link";

export default async function DevelopmentsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);
  const td = t.admin.developments;

  const rows = await db`
    SELECT d.*, COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;

  return (
    <div>
      <div style={header}>
        <h1 style={pageTitle}>{td.title}</h1>
        <Link href={`/${lang}/admin/developments/new`} style={btnPrimary}>
          + {td.new}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "#6b7280" }}>{td.empty}</p>
      ) : (
        <div style={grid}>
          {rows.map((d) => (
            <Link key={d.id} href={`/${lang}/admin/developments/${d.id}`} style={card}>
              <div style={cardHeader}>
                <span style={statusBadge(d.status)}>
                  {td.status[d.status as keyof typeof td.status] ?? d.status}
                </span>
              </div>
              <h2 style={cardTitle}>{d.name}</h2>
              <p style={cardSub}>{d.address}</p>
              {d.completion_date && (
                <p style={cardMeta}>
                  {new Date(d.completion_date).toLocaleDateString(lang === "es" ? "es-AR" : "en-US")}
                </p>
              )}
              <p style={cardMeta}>{d.unit_count} {td.units}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700 };
const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#111", color: "#fff",
  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem",
};
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" };
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 10, padding: "1.25rem",
  textDecoration: "none", color: "inherit", border: "1px solid #e5e7eb",
  display: "block", transition: "box-shadow 0.15s",
};
const cardHeader: React.CSSProperties = { marginBottom: "0.5rem" };
const cardTitle: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.25rem" };
const cardSub: React.CSSProperties = { fontSize: "0.85rem", color: "#6b7280" };
const cardMeta: React.CSSProperties = { fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.25rem" };

function statusBadge(status: string): React.CSSProperties {
  const colors: Record<string, string> = {
    active: "#dcfce7",
    completed: "#dbeafe",
    cancelled: "#fee2e2",
  };
  const text: Record<string, string> = {
    active: "#166534",
    completed: "#1e40af",
    cancelled: "#991b1b",
  };
  return {
    display: "inline-block",
    padding: "0.15rem 0.5rem",
    borderRadius: 999,
    fontSize: "0.75rem",
    fontWeight: 600,
    background: colors[status] ?? "#f3f4f6",
    color: text[status] ?? "#374151",
  };
}
