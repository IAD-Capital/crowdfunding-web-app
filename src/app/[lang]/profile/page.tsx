import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { getSession } from "@/lib/session";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import PublicShell from "@/components/PublicShell";
import ProfileForm from "@/components/admin/ProfileForm";

export default async function ProfilePage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();
  if (!session) redirect(`/${lang}/login?next=/${lang}/profile`);

  const [user] = await db<{
    id: number;
    full_name: string;
    email: string;
    role: string;
    avatar: string | null;
    phone: string | null;
    alternate_email: string | null;
  }[]>`
    SELECT id, full_name, email, role, avatar, phone, alternate_email
    FROM users WHERE id = ${session.sub}
  `;

  if (!user) redirect(`/${lang}/login`);

  return (
    <PublicShell lang={lang}>
      <div style={wrap}>
        <div style={header}>
          <h1 style={title}>Mi perfil</h1>
          <p style={sub}>Editá tu información personal y foto de perfil</p>
        </div>
        <div style={card}>
          <ProfileForm initial={{
            id: Number(user.id),
            full_name: String(user.full_name),
            email: String(user.email),
            role: String(user.role),
            avatar: user.avatar ? String(user.avatar) : null,
            phone: user.phone ? String(user.phone) : null,
            alternate_email: user.alternate_email ? String(user.alternate_email) : null,
          }} />
        </div>
      </div>
    </PublicShell>
  );
}

const wrap: React.CSSProperties = { maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem" };
const header: React.CSSProperties = { marginBottom: "1.5rem" };
const title: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700, margin: 0 };
const sub: React.CSSProperties = { color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.9rem" };
const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "2rem",
};
