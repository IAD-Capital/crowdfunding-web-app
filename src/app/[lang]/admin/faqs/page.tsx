import db from "@/lib/db";
import FaqsView, { type Faq } from "@/components/admin/FaqsView";

export default async function AdminFaqsPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const rows = await db<Faq[]>`
    SELECT f.id, f.question, f.answer, f.is_active, f.available_in_chatbot, f.sort_order,
           f.section_id, s.name AS section_name
    FROM faqs f
    LEFT JOIN faq_sections s ON s.id = f.section_id
    ORDER BY f.sort_order, f.id
  `;

  return <FaqsView faqs={rows} lang={lang} />;
}
