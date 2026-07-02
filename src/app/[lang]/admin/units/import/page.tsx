import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import CSVImportView from "@/components/admin/CSVImportView";
import db from "@/lib/db";

export default async function UnitsImportPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  const developments = await db<{ id: number; name: string; slug: string | null }[]>`
    SELECT id, name, slug FROM developments ORDER BY updated_at DESC
  `;

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
        Importar unidades desde CSV
      </h1>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Subí un archivo CSV para crear múltiples unidades de una vez, asociadas por slug del emprendimiento.
      </p>
      <CSVImportView lang={lang} developments={developments} />
    </div>
  );
}
