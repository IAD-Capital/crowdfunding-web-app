import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { redirect } from "next/navigation";
import InvestmentsTable from "@/components/admin/InvestmentsTable";

export default async function AdminInvestmentsPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const { error } = await requireSuperAdmin();
  if (error) redirect(`/${lang}/login`);

  const rows = await db`
    SELECT
      i.id, i.percentage, i.amount_usd, i.status, i.created_at,
      u.id AS unit_id, u.identifier, u.price_usd AS unit_price_usd,
      u.group_expires_at,
      d.id AS development_id, d.name AS development_name,
      usr.id AS user_id, usr.full_name, usr.email, usr.avatar
    FROM investments i
    JOIN units u ON u.id = i.unit_id
    JOIN developments d ON d.id = u.development_id
    JOIN users usr ON usr.id = i.user_id
    ORDER BY i.created_at DESC
  `;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serialized = rows.map((r: any) => ({
    id: Number(r.id),
    percentage: Number(r.percentage),
    amount_usd: Number(r.amount_usd),
    status: String(r.status),
    created_at: new Date(r.created_at as string).toISOString(),
    unit_id: Number(r.unit_id),
    identifier: String(r.identifier),
    unit_price_usd: Number(r.unit_price_usd),
    group_expires_at: r.group_expires_at ? new Date(r.group_expires_at as string).toISOString() : null,
    development_id: Number(r.development_id),
    development_name: String(r.development_name),
    user_id: Number(r.user_id),
    full_name: String(r.full_name),
    email: String(r.email),
    avatar: r.avatar ? String(r.avatar) : null,
  }));

  return (
    <div>
      <div style={header}>
        <div>
          <h1 style={title}>Inversiones</h1>
          <p style={sub}>Todas las inversiones activas y anteriores</p>
        </div>
      </div>
      <InvestmentsTable investments={serialized} lang={lang} />
    </div>
  );
}

const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" };
const title: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, margin: 0 };
const sub: React.CSSProperties = { color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.9rem" };
