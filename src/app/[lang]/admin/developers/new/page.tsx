import db from "@/lib/db";
import DeveloperForm, { type DevelopmentOption } from "@/components/admin/DeveloperForm";

export default async function NewDeveloperPage({ params }: { params: { lang: string } }) {
  const lang = params.lang;

  const allDevelopments = await db<DevelopmentOption[]>`
    SELECT id, name FROM developments ORDER BY name
  `;

  return <DeveloperForm lang={lang} allDevelopments={allDevelopments} />;
}
