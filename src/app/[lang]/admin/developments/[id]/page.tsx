import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/admin/ImageGallery";
import UnitsView, { type UnitRow } from "@/components/admin/UnitsView";

export default async function DevelopmentDetailPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const t = await getDictionary(lang);
  const td = t.admin.developments;
  const tu = t.admin.units;

  const [dev] = await db`SELECT * FROM developments WHERE id = ${params.id}`;
  if (!dev) notFound();

  const units = await db<UnitRow[]>`
    SELECT u.*, COALESCE(inv.investment_ids, '{}') AS investment_ids
    FROM units u
    LEFT JOIN (
      SELECT unit_id, array_agg(id ORDER BY id) AS investment_ids
      FROM investments
      WHERE status IN ('pending', 'approved')
      GROUP BY unit_id
    ) inv ON inv.unit_id = u.id
    WHERE u.development_id = ${params.id}
    ORDER BY u.updated_at DESC
  `;
  const serializedUnits = units.map((u) => ({
    ...u,
    created_at: u.created_at ? new Date(u.created_at as unknown as string).toISOString() : undefined,
    updated_at: u.updated_at ? new Date(u.updated_at as unknown as string).toISOString() : undefined,
  }));

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === "es" ? "es-AR" : "en-US", { timeZone: "UTC" }) : "—";

  return (
    <div>
      {/* Back */}
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href={`/${lang}/admin/developments`} style={backLink}>← {t.admin.nav.back}</Link>
      </div>

      {/* Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{dev.name}</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>{dev.address}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href={`/${lang}/admin/developments/${dev.id}/edit`} style={btnSecondary}>
            Editar
          </Link>
        </div>
      </div>

      {/* Info cards */}
      <div style={infoGrid}>
        <InfoCard label={td.form.completionDate} value={fmtDate(dev.completion_date)} />
        <InfoCard label={td.form.status} value={td.status[dev.status as keyof typeof td.status] ?? dev.status} />
        <InfoCard label="Creado" value={fmtDate(dev.created_at)} />
        <InfoCard label="Última actualización" value={fmtDate(dev.updated_at)} />
      </div>

      {dev.description && (
        <p style={{ margin: "1rem 0", color: "#374151", fontSize: "0.9rem" }}>{dev.description}</p>
      )}

      {/* Amenities */}
      {dev.amenities?.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={sectionLabel}>{td.form.amenities.split(" ")[0]}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
            {dev.amenities.map((a: string) => (
              <span key={a} style={tag}>{a.trim()}</span>
            ))}
          </div>
        </div>
      )}

      {/* Photo gallery */}
      {dev.images?.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={sectionLabel}>Fotos ({dev.images.length})</p>
          <ImageGallery images={dev.images} />
        </div>
      )}

      {/* Units section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "2rem 0 1rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{tu.title}</h2>
        <Link href={`/${lang}/admin/developments/${dev.id}/units/new`} style={btnPrimary}>
          + {tu.new}
        </Link>
      </div>

      {units.length === 0 ? (
        <p style={{ color: "#6b7280" }}>{tu.empty}</p>
      ) : (
        <UnitsView
          units={serializedUnits}
          lang={lang}
          statusT={tu.status as { available: string; partial: string; sold: string }}
          priceLabel={tu.form.priceUsd}
          floorLabel={tu.form.floor}
          roomsLabel={tu.form.rooms}
        />
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCard}>
      <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }}>{label}</p>
      <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{value}</p>
    </div>
  );
}

const backLink: React.CSSProperties = { color: "#6b7280", textDecoration: "none", fontSize: "0.875rem" };
const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#111", color: "#fff",
  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#fff", color: "#111",
  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
  border: "1px solid #d1d5db",
};
const infoGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem",
};
const infoCard: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "0.75rem 1rem",
};
const sectionLabel: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem",
};
const tag: React.CSSProperties = {
  padding: "0.2rem 0.6rem", background: "#f3f4f6", borderRadius: 999,
  fontSize: "0.78rem", color: "#374151",
};
