import db from "@/lib/db";
import DevelopersView, { type Developer } from "@/components/admin/DevelopersView";

export default async function AdminDevelopersPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const rows = await db<Developer[]>`
    SELECT dv.id, dv.name, dv.website, dv.logo, COUNT(d.id)::int AS development_count
    FROM developers dv
    LEFT JOIN developments d ON d.developer_id = dv.id
    GROUP BY dv.id
    ORDER BY dv.created_at DESC
  `;

  return <DevelopersView developers={rows} lang={lang} />;
}
