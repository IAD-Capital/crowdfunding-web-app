import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserForm from "@/components/admin/UserForm";

export default async function NewUserPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();

  if (!session || session.role !== "superadmin") redirect(`/${lang}/admin/users`);

  const t = await getDictionary(lang);

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href={`/${lang}/admin/users`} style={backLink}>
          ← {t.admin.nav.back}
        </Link>
      </div>
      <h1 style={pageTitle}>Nuevo usuario</h1>
      <UserForm lang={lang} mode="create" />
    </div>
  );
}

const backLink: React.CSSProperties = { color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" };
