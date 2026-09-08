import db from "@/lib/db";
import FaqForm, { type SectionOption } from "@/components/admin/FaqForm";

export default async function NewFaqPage({ params }: { params: { lang: string } }) {
  const sections = await db<SectionOption[]>`SELECT id, name FROM faq_sections ORDER BY sort_order, id`;
  return <FaqForm lang={params.lang} sections={sections} />;
}
