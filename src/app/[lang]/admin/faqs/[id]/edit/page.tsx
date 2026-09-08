import { notFound } from "next/navigation";
import db from "@/lib/db";
import FaqForm, { type Initial, type SectionOption } from "@/components/admin/FaqForm";

export default async function EditFaqPage({ params }: { params: { lang: string; id: string } }) {
  const [row] = await db`SELECT * FROM faqs WHERE id = ${params.id}`;
  if (!row) notFound();

  const sections = await db<SectionOption[]>`SELECT id, name FROM faq_sections ORDER BY sort_order, id`;

  const initial: Initial = {
    id: row.id,
    question: row.question,
    answer: row.answer,
    is_active: row.is_active,
    available_in_chatbot: row.available_in_chatbot,
    section_id: row.section_id,
  };

  return <FaqForm lang={params.lang} initial={initial} sections={sections} />;
}
