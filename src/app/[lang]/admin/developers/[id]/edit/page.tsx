import { notFound } from "next/navigation";
import db from "@/lib/db";
import DeveloperForm, { type Initial, type DevelopmentOption } from "@/components/admin/DeveloperForm";

export default async function EditDeveloperPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const lang = params.lang;

  const [[developer], developments, allDevelopments] = await Promise.all([
    db`SELECT * FROM developers WHERE id = ${params.id}`,
    db<DevelopmentOption[]>`SELECT id, name FROM developments WHERE developer_id = ${params.id} ORDER BY name`,
    db<DevelopmentOption[]>`SELECT id, name FROM developments ORDER BY name`,
  ]);
  if (!developer) notFound();

  const initial: Initial = {
    id: developer.id,
    name: developer.name,
    website: developer.website,
    logo: developer.logo,
    developments,
  };

  return <DeveloperForm lang={lang} initial={initial} allDevelopments={allDevelopments} />;
}
