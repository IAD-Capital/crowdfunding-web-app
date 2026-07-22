import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import DevelopmentsCSVImportView from "@/components/admin/DevelopmentsCSVImportView";

export default async function DevelopmentsImportPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Importar emprendimientos desde CSV
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Subí un archivo CSV para crear múltiples emprendimientos de una vez. No incluye imágenes ni unidades — solo la información.
      </p>
      <DevelopmentsCSVImportView lang={lang} />
    </div>
  );
}
