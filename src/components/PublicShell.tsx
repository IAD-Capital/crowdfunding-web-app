import Header from "./Header";
import Footer from "./Footer";
import ComingSoon from "./ComingSoon";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Locale } from "@/i18n";

export default async function PublicShell({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  const [settings] = await db<{ coming_soon_enabled: boolean; coming_soon_expires_at: string | null }[]>`
    SELECT coming_soon_enabled, coming_soon_expires_at FROM app_settings WHERE id = 1
  `;
  const session = await getSession();
  const isSuperadmin = session?.role === "superadmin";

  const gated =
    !isSuperadmin &&
    !!settings?.coming_soon_enabled &&
    !!settings.coming_soon_expires_at &&
    new Date(settings.coming_soon_expires_at) > new Date();

  if (gated) {
    return <ComingSoon expiresAt={settings!.coming_soon_expires_at!} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header lang={lang} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer lang={lang} />
    </div>
  );
}
