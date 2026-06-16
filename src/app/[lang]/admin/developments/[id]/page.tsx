import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import db from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/admin/ImageGallery";

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

  const units = await db`
    SELECT * FROM units WHERE development_id = ${params.id} ORDER BY floor, identifier
  `;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === "es" ? "es-AR" : "en-US") : "—";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
        <Link href={`/${lang}/admin/developments`} style={backLink}>← {t.admin.nav.back}</Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{dev.name}</h1>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>{dev.address}</p>
        </div>
        <Link href={`/${lang}/admin/developments/${dev.id}/edit`} style={btnSecondary}>
          Editar
        </Link>
      </div>

      {/* Dev info cards */}
      <div style={infoGrid}>
        <InfoCard label={td.form.completionDate} value={fmtDate(dev.completion_date)} />
        <InfoCard label={td.form.status} value={td.status[dev.status as keyof typeof td.status] ?? dev.status} />
      </div>

      {dev.description && (
        <p style={{ margin: "1rem 0", color: "#374151", fontSize: "0.9rem" }}>{dev.description}</p>
      )}

      {dev.amenities?.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem" }}>
            {td.form.amenities.split(" ")[0]}
          </p>
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
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#6b7280", marginBottom: "0.5rem" }}>
            Fotos ({dev.images.length})
          </p>
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
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                {["ID", tu.form.floor, "m² tot", "m² cub", tu.form.rooms, tu.form.priceUsd, tu.form.status, "Fotos"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={td_}><strong>{u.identifier}</strong> {u.floor != null ? `P${u.floor}` : ""}</td>
                  <td style={td_}>{u.floor ?? "—"}</td>
                  <td style={td_}>{u.total_m2 ?? "—"}</td>
                  <td style={td_}>{u.covered_m2 ?? "—"}</td>
                  <td style={td_}>{u.rooms ?? "—"}</td>
                  <td style={td_}>{u.price_usd != null ? `USD ${Number(u.price_usd).toLocaleString()}` : "—"}</td>
                  <td style={td_}>
                    <span style={statusBadge(u.status)}>
                      {tu.status[u.status as keyof typeof tu.status] ?? u.status}
                    </span>
                  </td>
                  <td style={td_}>{u.images?.length ?? 0}</td>
                  <td style={td_}>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <Link href={`/${lang}/admin/developments/${dev.id}/units/${u.id}`} style={{ color: "#111", fontSize: "0.8rem", fontWeight: 600 }}>
                        Ver
                      </Link>
                      <Link href={`/${lang}/admin/developments/${dev.id}/units/${u.id}/edit`} style={{ color: "#6b7280", fontSize: "0.8rem" }}>
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
const tag: React.CSSProperties = {
  padding: "0.2rem 0.6rem", background: "#f3f4f6", borderRadius: 999,
  fontSize: "0.78rem", color: "#374151",
};
const tableWrap: React.CSSProperties = { background: "#fff", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "hidden" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" };
const th: React.CSSProperties = { padding: "0.65rem 1rem", textAlign: "left", background: "#f9fafb", fontWeight: 600, fontSize: "0.8rem", color: "#6b7280" };
const td_: React.CSSProperties = { padding: "0.65rem 1rem", color: "#111" };

function statusBadge(status: string): React.CSSProperties {
  const bg: Record<string, string> = { available: "#dcfce7", partial: "#fef9c3", sold: "#fee2e2" };
  const fg: Record<string, string> = { available: "#166534", partial: "#854d0e", sold: "#991b1b" };
  return {
    display: "inline-block", padding: "0.15rem 0.5rem", borderRadius: 999,
    fontSize: "0.75rem", fontWeight: 600,
    background: bg[status] ?? "#f3f4f6", color: fg[status] ?? "#374151",
  };
}
