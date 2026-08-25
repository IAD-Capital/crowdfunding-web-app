import db from "@/lib/db";
import ChatbotQuestionsView, { type ChatbotQuestion } from "@/components/admin/ChatbotQuestionsView";

export default async function AdminChatbotPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const rows = await db<ChatbotQuestion[]>`
    SELECT q.id, q.question, q.answer, q.is_active, q.sort_order,
      (SELECT COUNT(*)::int FROM chatbot_questions c WHERE c.parent_id = q.id) AS child_count
    FROM chatbot_questions q
    WHERE q.parent_id IS NULL
    ORDER BY q.sort_order, q.id
  `;

  return <ChatbotQuestionsView questions={rows} lang={lang} parentId={null} />;
}
