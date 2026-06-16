import Header from "./Header";
import Footer from "./Footer";
import type { Locale } from "@/i18n";

export default function PublicShell({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header lang={lang} />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer lang={lang} />
    </div>
  );
}
