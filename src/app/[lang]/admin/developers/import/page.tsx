import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import DevelopersCSVImportView from "@/components/admin/DevelopersCSVImportView";

export default async function DevelopersImportPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Importar desarrolladoras desde CSV
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Subí un archivo CSV para crear múltiples desarrolladoras de una vez. No incluye logos — solo la información.
      </p>
      <DevelopersCSVImportView lang={lang} />
    </div>
  );
}
