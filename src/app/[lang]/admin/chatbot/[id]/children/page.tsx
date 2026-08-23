import { notFound } from "next/navigation";
import db from "@/lib/db";
import ChatbotQuestionsView, { type ChatbotQuestion, type ParentQuestion } from "@/components/admin/ChatbotQuestionsView";

export default async function AdminChatbotChildrenPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const lang = params.lang;

  const [[parent], rows] = await Promise.all([
    db<ParentQuestion[]>`SELECT id, question, parent_id FROM chatbot_questions WHERE id = ${params.id}`,
    db<ChatbotQuestion[]>`
      SELECT q.id, q.question, q.answer, q.is_active, q.sort_order,
        (SELECT COUNT(*)::int FROM chatbot_questions c WHERE c.parent_id = q.id) AS child_count
      FROM chatbot_questions q
      WHERE q.parent_id = ${params.id}
      ORDER BY q.sort_order, q.id
    `,
  ]);
  if (!parent) notFound();

  return <ChatbotQuestionsView questions={rows} lang={lang} parentId={parent.id} parentQuestion={parent} />;
}
