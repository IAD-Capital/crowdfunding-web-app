import FaqForm from "@/components/admin/FaqForm";

export default function NewFaqPage({ params }: { params: { lang: string } }) {
  return <FaqForm lang={params.lang} />;
}
