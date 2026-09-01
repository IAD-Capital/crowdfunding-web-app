import db from "@/lib/db";
import FaqSectionsView, { type FaqSection } from "@/components/admin/FaqSectionsView";

export default async function AdminFaqSectionsPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const rows = await db<FaqSection[]>`
    SELECT s.id, s.name, s.sort_order, COUNT(f.id)::int AS faq_count
    FROM faq_sections s
    LEFT JOIN faqs f ON f.section_id = s.id
    GROUP BY s.id
    ORDER BY s.sort_order, s.id
  `;

  return <FaqSectionsView sections={rows} lang={lang} />;
}
