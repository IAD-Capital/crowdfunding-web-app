import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";

export default async function UsersPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);

  const users = await db`
    SELECT id, full_name, email, role, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  const roleBadge = (role: string): React.CSSProperties => ({
    display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 999,
    fontSize: "0.75rem", fontWeight: 600,
    background: role === "admin" ? "#dbeafe" : "#f3f4f6",
    color: role === "admin" ? "#1e40af" : "#374151",
  });

  return (
    <div>
      <h1 style={pageTitle}>{t.admin.nav.users}</h1>

      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              {["Nombre", "Email", "Rol", "Fecha de registro"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={td}><strong>{u.full_name}</strong></td>
                <td style={td}>{u.email}</td>
                <td style={td}>
                  <span style={roleBadge(u.role)}>{u.role}</span>
                </td>
                <td style={td}>
                  {new Date(u.created_at).toLocaleDateString(
                    lang === "es" ? "es-AR" : "en-US",
                    { day: "2-digit", month: "short", year: "numeric" }
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" };
const tableWrap: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const th: React.CSSProperties = { padding: "0.65rem 1rem", textAlign: "left", background: "#f9fafb", fontWeight: 600, fontSize: "0.8rem", color: "#6b7280" };
const td: React.CSSProperties = { padding: "0.65rem 1rem", color: "#111" };
