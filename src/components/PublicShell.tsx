import { Suspense } from "react";
import Header from "./Header";
import HeaderFallback from "./HeaderFallback";
import Footer from "./Footer";
import ComingSoon from "./ComingSoon";
import ChatbotWidget from "./ChatbotWidget";
import InstallAppPrompt from "./InstallAppPrompt";
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
  // SELECT * (rather than naming chatbot_enabled explicitly) so this keeps
  // working even before migration 008 has added that column — the widget
  // just defaults to enabled via the `?? true` below in that case.
  const [settings] = await db<
    { coming_soon_enabled: boolean; coming_soon_expires_at: string | null; chatbot_enabled?: boolean }[]
  >`
    SELECT * FROM app_settings WHERE id = 1
  `;
  const session = await getSession();
  const isSuperadmin = session?.role === "superadmin";

  const gated =
    !isSuperadmin &&
    !!settings?.coming_soon_enabled &&
    !!settings.coming_soon_expires_at &&
    new Date(settings.coming_soon_expires_at) > new Date();

  if (gated) {
    return <ComingSoon expiresAt={settings!.coming_soon_expires_at!} lang={lang} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Suspense fallback={<HeaderFallback lang={lang} />}>
        <Header lang={lang} />
      </Suspense>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer lang={lang} />
      {(settings?.chatbot_enabled ?? true) && <ChatbotWidget userEmail={session?.email ?? null} />}
      <InstallAppPrompt />
    </div>
  );
}
