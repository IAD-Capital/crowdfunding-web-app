import ChatbotQuestionForm from "@/components/admin/ChatbotQuestionForm";

export default function NewChatbotQuestionPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { prefill?: string; fromUnanswered?: string; parent?: string };
}) {
  return (
    <ChatbotQuestionForm
      lang={params.lang}
      prefillQuestion={searchParams.prefill}
      fromUnansweredId={searchParams.fromUnanswered}
      parentId={searchParams.parent ? Number(searchParams.parent) : null}
    />
  );
}
