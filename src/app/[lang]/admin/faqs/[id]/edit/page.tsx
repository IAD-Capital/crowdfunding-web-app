import { notFound } from "next/navigation";
import db from "@/lib/db";
import FaqForm, { type Initial } from "@/components/admin/FaqForm";

export default async function EditFaqPage({ params }: { params: { lang: string; id: string } }) {
  const [row] = await db`SELECT * FROM faqs WHERE id = ${params.id}`;
  if (!row) notFound();

  const initial: Initial = {
    id: row.id,
    question: row.question,
    answer: row.answer,
    is_active: row.is_active,
    available_in_chatbot: row.available_in_chatbot,
  };

  return <FaqForm lang={params.lang} initial={initial} />;
}
