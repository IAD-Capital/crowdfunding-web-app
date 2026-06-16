import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import AdminHeader from "@/components/AdminHeader";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f9fafb" }}>
      <AdminHeader lang={lang} />
      <main style={{ flex: 1, maxWidth: 1400, width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {children}
      </main>
    </div>
  );
}
