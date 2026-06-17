import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getSession } from "@/lib/session";
import db from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import DeleteUserButton from "@/components/admin/DeleteUserButton";

export default async function UsersPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const [session, t] = await Promise.all([getSession(), getDictionary(lang)]);
  const isSuperAdmin = session?.role === "superadmin";

  const users = await db`
    SELECT id, full_name, email, role, avatar, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  return (
    <div>
      <div style={header}>
        <h1 style={pageTitle}>{t.admin.nav.users}</h1>
        {isSuperAdmin && (
          <Link href={`/${lang}/admin/users/new`} style={btnPrimary}>
            + Nuevo usuario
          </Link>
        )}
      </div>

      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              {["", "Nombre", "Email", "Rol", "Registrado", ...(isSuperAdmin ? [""] : [])].map((h, i) => (
                <th key={i} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                {/* Avatar */}
                <td style={{ ...td, width: 48, paddingRight: 0 }}>
                  <div style={avatarWrap}>
                    {u.avatar ? (
                      <Image src={u.avatar} alt={u.full_name} fill style={{ objectFit: "cover", borderRadius: "50%" }} />
                    ) : (
                      <div style={avatarFallback}>
                        {u.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </td>
                <td style={td}><strong>{u.full_name}</strong></td>
                <td style={{ ...td, color: "#6b7280" }}>{u.email}</td>
                <td style={td}>
                  <span style={roleBadge(u.role)}>
                    {u.role === "superadmin" ? "Superadmin" : "Investor"}
                  </span>
                </td>
                <td style={{ ...td, color: "#9ca3af", fontSize: "0.8rem" }}>
                  {new Date(u.created_at).toLocaleDateString(
                    lang === "es" ? "es-AR" : "en-US",
                    { day: "2-digit", month: "short", year: "numeric" }
                  )}
                </td>
                {isSuperAdmin && (
                  <td style={td}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <Link
                        href={`/${lang}/admin/users/${u.id}/edit`}
                        style={linkEdit}
                      >
                        Editar
                      </Link>
                      <DeleteUserButton userId={u.id} currentUserId={Number(session?.sub)} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function roleBadge(role: string): React.CSSProperties {
  const colors: Record<string, { bg: string; fg: string }> = {
    superadmin: { bg: "#ede9fe", fg: "#5b21b6" },
    investor:   { bg: "#dbeafe", fg: "#1e40af" },
  };
  const c = colors[role] ?? { bg: "#f3f4f6", fg: "#374151" };
  return {
    display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 999,
    fontSize: "0.75rem", fontWeight: 700, background: c.bg, color: c.fg,
  };
}

const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700 };
const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#111", color: "#fff",
  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
};
const tableWrap: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const th: React.CSSProperties = { padding: "0.65rem 1rem", textAlign: "left", background: "#f9fafb", fontWeight: 600, fontSize: "0.8rem", color: "#6b7280" };
const td: React.CSSProperties = { padding: "0.65rem 1rem", color: "#111" };
const avatarWrap: React.CSSProperties = { position: "relative", width: 36, height: 36, borderRadius: "50%", overflow: "hidden", border: "1px solid #e5e7eb", flexShrink: 0 };
const avatarFallback: React.CSSProperties = {
  width: "100%", height: "100%", background: "#111", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.875rem", fontWeight: 700,
};
const linkEdit: React.CSSProperties = { color: "#111", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" };
