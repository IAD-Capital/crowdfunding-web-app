import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import Link from "next/link";

export default async function UnitsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);
  const tu = t.admin.units;

  const units = await db`
    SELECT u.*, d.name AS development_name, d.id AS development_id
    FROM units u
    JOIN developments d ON d.id = u.development_id
    ORDER BY d.name, u.floor, u.identifier
  `;

  return (
    <div>
      <h1 style={pageTitle}>{tu.title}</h1>

      {units.length === 0 ? (
        <p style={{ color: "#6b7280" }}>{tu.empty}</p>
      ) : (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {[
                  t.admin.developments.title,
                  tu.form.identifier,
                  tu.form.floor,
                  "m² tot",
                  "m² cub",
                  tu.form.rooms,
                  tu.form.priceUsd,
                  tu.form.status,
                  "Fotos",
                  "",
                ].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={td}>
                    <Link href={`/${lang}/admin/developments/${u.development_id}`} style={devLink}>
                      {u.development_name}
                    </Link>
                  </td>
                  <td style={td}><strong>{u.identifier}</strong></td>
                  <td style={td}>{u.floor ?? "—"}</td>
                  <td style={td}>{u.total_m2 ?? "—"}</td>
                  <td style={td}>{u.covered_m2 ?? "—"}</td>
                  <td style={td}>{u.rooms ?? "—"}</td>
                  <td style={td}>
                    {u.price_usd != null ? `USD ${Number(u.price_usd).toLocaleString()}` : "—"}
                  </td>
                  <td style={td}>
                    <span style={statusBadge(u.status)}>
                      {tu.status[u.status as keyof typeof tu.status] ?? u.status}
                    </span>
                  </td>
                  <td style={td}>{u.images?.length ?? 0}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <Link href={`/${lang}/admin/developments/${u.development_id}/units/${u.id}`} style={{ color: "#111", fontSize: "0.8rem", fontWeight: 600 }}>
                        Ver
                      </Link>
                      <Link href={`/${lang}/admin/developments/${u.development_id}/units/${u.id}/edit`} style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" };
const tableWrap: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const th: React.CSSProperties = { padding: "0.65rem 1rem", textAlign: "left", background: "#f9fafb", fontWeight: 600, fontSize: "0.8rem", color: "#6b7280" };
const td: React.CSSProperties = { padding: "0.65rem 1rem", color: "#111" };
const devLink: React.CSSProperties = { color: "#374151", textDecoration: "none", fontWeight: 500 };

function statusBadge(status: string): React.CSSProperties {
  const bg: Record<string, string> = { available: "#dcfce7", partial: "#fef9c3", sold: "#fee2e2" };
  const fg: Record<string, string> = { available: "#166534", partial: "#854d0e", sold: "#991b1b" };
  return {
    display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 999,
    fontSize: "0.75rem", fontWeight: 600,
    background: bg[status] ?? "#f3f4f6", color: fg[status] ?? "#374151",
  };
}
