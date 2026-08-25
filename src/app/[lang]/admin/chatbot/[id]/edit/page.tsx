import { notFound } from "next/navigation";
import db from "@/lib/db";
import ChatbotQuestionForm, { type Initial } from "@/components/admin/ChatbotQuestionForm";

export default async function EditChatbotQuestionPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const [row] = await db`SELECT * FROM chatbot_questions WHERE id = ${params.id}`;
  if (!row) notFound();

  const initial: Initial = {
    id: row.id,
    question: row.question,
    answer: row.answer,
    is_active: row.is_active,
    parent_id: row.parent_id,
  };

  return <ChatbotQuestionForm lang={params.lang} initial={initial} />;
}
