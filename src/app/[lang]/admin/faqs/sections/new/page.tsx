import FaqSectionForm from "@/components/admin/FaqSectionForm";

export default function NewFaqSectionPage({ params }: { params: { lang: string } }) {
  return <FaqSectionForm lang={params.lang} />;
}
