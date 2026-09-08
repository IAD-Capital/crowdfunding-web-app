import { notFound } from "next/navigation";
import db from "@/lib/db";
import FaqSectionForm, { type Initial } from "@/components/admin/FaqSectionForm";

export default async function EditFaqSectionPage({ params }: { params: { lang: string; id: string } }) {
  const [row] = await db`SELECT * FROM faq_sections WHERE id = ${params.id}`;
  if (!row) notFound();

  const initial: Initial = { id: row.id, name: row.name };

  return <FaqSectionForm lang={params.lang} initial={initial} />;
}
