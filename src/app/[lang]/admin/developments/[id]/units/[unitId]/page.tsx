import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/admin/ImageGallery";

export default async function UnitDetailPage({
  params,
}: {
  params: { lang: string; id: string; unitId: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);
  const tu = t.admin.units;

  const [[dev], [unit]] = await Promise.all([
    db`SELECT id, name FROM developments WHERE id = ${params.id}`,
    db`SELECT * FROM units WHERE id = ${params.unitId} AND development_id = ${params.id}`,
  ]);
  if (!dev || !unit) notFound();

  const fmt = (v: number | null, suffix = "") => v != null ? `${v}${suffix}` : "—";
  const fmtUsd = (v: number | null) => v != null ? `USD ${Number(v).toLocaleString()}` : "—";
  const fmtDate = (v: unknown) => v ? new Date(v as string).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const fields = [
    { label: tu.form.floor,       value: fmt(unit.floor) },
    { label: tu.form.totalM2,     value: fmt(unit.total_m2, " m²") },
    { label: tu.form.coveredM2,   value: fmt(unit.covered_m2, " m²") },
    { label: tu.form.uncoveredM2, value: fmt(unit.uncovered_m2, " m²") },
    { label: tu.form.rooms,       value: fmt(unit.rooms) },
    { label: tu.form.bedrooms,    value: fmt(unit.bedrooms) },
    { label: tu.form.bathrooms,   value: fmt(unit.bathrooms) },
    { label: tu.form.orientation, value: unit.orientation ? tu.form.orientations[unit.orientation as keyof typeof tu.form.orientations] ?? unit.orientation : "—" },
    { label: tu.form.priceUsd,    value: fmtUsd(unit.price_usd) },
    { label: "Creado",            value: fmtDate(unit.created_at) },
    { label: "Última actualización", value: fmtDate(unit.updated_at) },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
        <Link href={`/${lang}/admin/developments`} style={crumbLink}>{t.admin.nav.developments}</Link>
        <span>›</span>
        <Link href={`/${lang}/admin/developments/${params.id}`} style={crumbLink}>{dev.name}</Link>
        <span>›</span>
        <span style={{ color: "#111" }}>{unit.identifier}</span>
      </div>

      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{unit.identifier}</h1>
          {unit.floor != null && (
            <p style={{ color: "#6b7280", marginTop: "0.2rem", fontSize: "0.9rem" }}>
              {tu.form.floor} {unit.floor}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={statusBadge(unit.status)}>
            {tu.status[unit.status as keyof typeof tu.status] ?? unit.status}
          </span>
          <Link href={`/${lang}/admin/developments/${params.id}/units/${params.unitId}/edit`} style={btnSecondary}>
            Editar
          </Link>
        </div>
      </div>

      {/* Info grid */}
      <div style={infoGrid}>
        {fields.map(({ label, value }) => (
          <div key={label} style={infoCard}>
            <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.2rem" }}>{label}</p>
            <p style={{ fontWeight: 600 }}>{value}</p>
          </div>
        ))}
      </div>

      {unit.description && (
        <p style={{ margin: "1.25rem 0", color: "#374151", fontSize: "0.9rem" }}>{unit.description}</p>
      )}

      {/* Photo gallery */}
      {unit.images?.length > 0 ? (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem" }}>
            Fotos ({unit.images.length})
          </p>
          <ImageGallery images={unit.images} />
        </div>
      ) : (
        <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginTop: "1.5rem" }}>
          Sin fotos cargadas.
        </p>
      )}
    </div>
  );
}

const crumbLink: React.CSSProperties = { color: "#6b7280", textDecoration: "none" };
const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#fff", color: "#111",
  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
  border: "1px solid #d1d5db",
};
const infoGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem",
};
const infoCard: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.75rem 1rem",
};

function statusBadge(status: string): React.CSSProperties {
  const bg: Record<string, string> = { available: "#dcfce7", partial: "#fef9c3", sold: "#fee2e2" };
  const fg: Record<string, string> = { available: "#166534", partial: "#854d0e", sold: "#991b1b" };
  return {
    display: "inline-block", padding: "0.2rem 0.65rem", borderRadius: 999,
    fontSize: "0.8rem", fontWeight: 600,
    background: bg[status] ?? "#f3f4f6", color: fg[status] ?? "#374151",
  };
}
