import db from "@/lib/db";
import FaqsView, { type Faq } from "@/components/admin/FaqsView";

export default async function AdminFaqsPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const rows = await db<Faq[]>`
    SELECT id, question, answer, is_active, available_in_chatbot, sort_order
    FROM faqs
    ORDER BY sort_order, id
  `;

  return <FaqsView faqs={rows} lang={lang} />;
}
