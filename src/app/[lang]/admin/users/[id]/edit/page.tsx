import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";
import UserForm from "@/components/admin/UserForm";

export default async function EditUserPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();

  if (!session || session.role !== "superadmin") redirect(`/${lang}/admin/users`);

  const [user] = await db`
    SELECT id, full_name, email, role, avatar FROM users WHERE id = ${params.id}
  `;
  if (!user) notFound();

  const t = await getDictionary(lang);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href={`/${lang}/admin/users`} style={backLink}>
          ← {t.admin.nav.back}
        </Link>
      </div>
      <h1 style={pageTitle}>Editar usuario</h1>
      <UserForm
        lang={lang}
        mode="edit"
        userId={user.id}
        initial={{
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        }}
      />
    </div>
  );
}

const backLink: React.CSSProperties = { color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" };
