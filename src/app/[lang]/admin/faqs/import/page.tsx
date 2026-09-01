import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import FaqsCSVImportView from "@/components/admin/FaqsCSVImportView";

export default async function FaqsImportPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Importar FAQs desde CSV o JSON
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Subí un archivo CSV o JSON para crear múltiples preguntas frecuentes de una vez.
      </p>
      <FaqsCSVImportView lang={lang} />
    </div>
  );
}
