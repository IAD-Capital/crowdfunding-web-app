import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import PublicShell from "@/components/PublicShell";
import ImageGallery from "@/components/admin/ImageGallery";
import Link from "next/link";
import Image from "next/image";
import { getAmenityIcon } from "@/lib/icons";

export default async function PublicDevelopmentPage({
  params,
}: {
  params: { lang: string; id: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();

  const isNumeric = /^\d+$/.test(params.id);
  const [dev] = isNumeric
    ? await db`SELECT * FROM developments WHERE id = ${params.id}`
    : await db`SELECT * FROM developments WHERE slug = ${params.id}`;
  if (!dev) notFound();
  if (!dev.visible && session?.role !== "superadmin") notFound();

  const units = await db`SELECT * FROM units WHERE development_id = ${dev.id} ORDER BY updated_at DESC`;

  const fmtDate = (d: unknown) =>
    d ? new Date(d as string).toLocaleDateString(lang === "es" ? "es-AR" : "en-US", { month: "long", year: "numeric", day: "numeric", timeZone: "UTC" }) : null;

  const availableUnits = units.filter((u) => u.status !== "sold");

  return (
    <PublicShell lang={lang}>
      {/* ─── Hero cover ─────────────────────────────── */}
      <div style={heroCover}>
        {dev.images?.[0] ? (
          <Image src={dev.images[0]} alt={dev.name} fill style={{ objectFit: "cover" }} priority />
        ) : (
          <div style={heroPlaceholder} />
        )}
        <div style={heroGradient} />
        <div style={heroContent}>
          <div style={heroInner}>
            <Link href={`/${lang}`} style={backLink}>← Volver</Link>
            <div style={statusPill}>{STATUS_LABELS[dev.status] ?? dev.status}</div>
            <h1 style={heroTitle}>{dev.name}</h1>
            <p style={heroAddr}>{dev.address}</p>
          </div>
        </div>
      </div>

      {/* ─── Body ───────────────────────────────────── */}
      <div style={body}>
        <div style={bodyInner}>
          {/* Left column */}
          <div style={leftCol}>
            {/* Info cards */}
            <div style={infoGrid}>
              {dev.completion_date && (
                <InfoCard label="Entrega estimada" value={fmtDate(dev.completion_date)!} />
              )}
              <InfoCard label="Unidades" value={`${units.length} en total`} />
              <InfoCard label="Disponibles" value={`${availableUnits.length} unidades`} />
              {dev.images?.length > 0 && (
                <InfoCard label="Fotos" value={`${dev.images.length} imágenes`} />
              )}
            </div>

            {/* Description */}
            {dev.description && (
              <div style={descSection}>
                <h2 style={sectionTitle}>Descripción</h2>
                <p style={descText}>{dev.description}</p>
              </div>
            )}

            {/* Amenities */}
            {dev.amenities?.length > 0 && (
              <div style={amenSection}>
                <h2 style={sectionTitle}>Amenities</h2>
                <div style={amenRow}>
                  {dev.amenities.map((a: string) => {
                    const Icon = getAmenityIcon(a);
                    return (
                      <span key={a} style={amenChip}><Icon size={14} /> {a}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gallery */}
            {dev.images?.length > 0 && (
              <div style={gallerySection}>
                <h2 style={sectionTitle}>Galería de fotos</h2>
                <ImageGallery images={dev.images} />
              </div>
            )}

            {/* Units */}
            <div style={unitsSection}>
              <h2 style={sectionTitle}>Unidades disponibles</h2>
              {units.length === 0 ? (
                <p style={{ color: "#9ca3af" }}>No hay unidades cargadas aún.</p>
              ) : (
                <div style={unitGrid}>
                  {units.map((u) => {
                    const sc = STATUS_UNIT[u.status] ?? { bg: "#f3f4f6", fg: "#374151", label: u.status };
                    return (
                      <Link key={u.id} href={`/${lang}/developments/${dev.slug ?? dev.id}/units/${u.id}`} style={{ ...unitCard, textDecoration: "none", color: "inherit" }}>
                        <div style={unitCover}>
                          {u.images?.[0] ? (
                            <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} sizes="(max-width: 600px) 90vw, 220px" />
                          ) : (
                            <div style={imgPlaceholder} />
                          )}
                        </div>
                        <div style={unitBody}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <h3 style={unitId}>{u.identifier}</h3>
                            <span style={{ ...badge, background: sc.bg, color: sc.fg }}>{sc.label}</span>
                          </div>
                          <div style={unitStats}>
                            {u.floor != null && <span style={chip}>Piso {u.floor}</span>}
                            {u.total_m2 != null && <span style={chip}>{u.total_m2} m²</span>}
                            {u.rooms != null && <span style={chip}>{u.rooms} amb.</span>}
                            {u.bedrooms != null && <span style={chip}>{u.bedrooms} dorm.</span>}
                            {u.orientation && <span style={chip}>{u.orientation}</span>}
                          </div>
                          {u.description && (
                            <p style={descClamp}>{u.description}</p>
                          )}
                          <p style={unitPrice}>
                            {u.price_usd != null
                              ? `USD ${Number(u.price_usd).toLocaleString("es-AR")}`
                              : "Consultar precio"}
                          </p>
                          <span style={viewUnitLink}>Ver detalle →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sticky sidebar */}
          <aside style={sidebar}>
            <div style={sideCard}>
              <p style={sidePriceLabel}>Desde</p>
              <p style={sidePrice}>
                {availableUnits.length > 0 && availableUnits[0].price_usd != null
                  ? `USD ${Number(availableUnits[0].price_usd).toLocaleString("es-AR")}`
                  : "Consultar"}
              </p>
              <p style={{ fontSize: "0.78rem", color: "#9ca3af", margin: 0 }}>
                {availableUnits.length} {availableUnits.length === 1 ? "unidad disponible" : "unidades disponibles"}
              </p>
              <div style={sideDivider} />
              {session?.role === "investor" || session?.role === "superadmin" ? (
                <p style={{ fontSize: "0.82rem", color: "#374151", textAlign: "center" }}>
                  Hacé click en una unidad para invertir.
                </p>
              ) : session ? null : (
                <>
                  <Link href={`/${lang}/signup`} style={sideBtnPrimary}>
                    Empezar a invertir
                  </Link>
                  <Link href={`/${lang}/login`} style={sideBtnOutline}>
                    Ya tengo cuenta
                  </Link>
                </>
              )}
              <div style={sideFact}>
                <span style={sideFactNum}>5%</span>
                <span style={sideFactLabel}>Mínimo de participación</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCard}>
      <p style={{ fontSize: "0.72rem", color: "#9ca3af", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: "0.25rem 0 0" }}>{value}</p>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const STATUS_UNIT: Record<string, { bg: string; fg: string; label: string }> = {
  available: { bg: "#dcfce7", fg: "#166534", label: "Disponible" },
  partial:   { bg: "#fef9c3", fg: "#854d0e", label: "Parcial" },
  sold:      { bg: "#fee2e2", fg: "#991b1b", label: "Vendida" },
};

/* Hero */
const heroCover: React.CSSProperties = { position: "relative", height: 420, background: "#111" };
const heroPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" };
const heroGradient: React.CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)" };
const heroContent: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const heroInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.5rem 2.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" };
const backLink: React.CSSProperties = { color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.5rem" };
const statusPill: React.CSSProperties = { display: "inline-block", width: "fit-content", background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 999, padding: "0.2rem 0.75rem", fontSize: "0.78rem", fontWeight: 600 };
const heroTitle: React.CSSProperties = { fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.03em", textShadow: "0 2px 8px rgba(0,0,0,0.3)" };
const heroAddr: React.CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", margin: 0 };

/* Body */
const body: React.CSSProperties = { background: "#f9fafb", padding: "3rem 1.5rem" };
const bodyInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 320px", gap: "2.5rem", alignItems: "start" };
const leftCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "2.5rem" };

/* Info grid */
const infoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" };
const infoCard: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.85rem 1rem" };

/* Sections */
const sectionTitle: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 800, margin: "0 0 1rem", letterSpacing: "-0.02em" };
const descSection: React.CSSProperties = {};
const descText: React.CSSProperties = { color: "#374151", lineHeight: 1.7, margin: 0 };
const descClamp: React.CSSProperties = {
  fontSize: "0.82rem", color: "#6b7280", margin: "0.35rem 0 0", lineHeight: 1.5,
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const amenSection: React.CSSProperties = {};
const amenRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.4rem" };
const amenChip: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.9rem", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 999, fontSize: "0.85rem", color: "#374151" };
const gallerySection: React.CSSProperties = {};
const unitsSection: React.CSSProperties = {};

/* Unit cards */
const unitGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" };
const unitCard: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", scrollMarginTop: 80 };
const unitCover: React.CSSProperties = { position: "relative", height: 110, background: "#f3f4f6" };
const imgPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f9fafb,#e5e7eb)" };
const unitBody: React.CSSProperties = { padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem" };
const unitId: React.CSSProperties = { fontSize: "0.9rem", fontWeight: 700, margin: 0 };
const unitStats: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.25rem" };
const chip: React.CSSProperties = { fontSize: "0.72rem", padding: "0.15rem 0.45rem", background: "#f3f4f6", borderRadius: 999, color: "#374151" };
const badge: React.CSSProperties = { padding: "0.1rem 0.45rem", borderRadius: 999, fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 };
const unitPrice: React.CSSProperties = { fontSize: "0.95rem", fontWeight: 800, color: "#111", margin: "0.1rem 0 0" };
const viewUnitLink: React.CSSProperties = { fontSize: "0.78rem", color: "#6b7280", fontWeight: 600, marginTop: "0.25rem" };
const btnSignup: React.CSSProperties = {
  display: "block", textAlign: "center", padding: "0.6rem 1rem",
  background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none",
  fontWeight: 700, fontSize: "0.875rem", marginTop: "0.25rem",
};

/* Sidebar */
const sidebar: React.CSSProperties = { position: "sticky", top: 80 };
const sideCard: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16,
  padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem",
};
const sidePriceLabel: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
const sidePrice: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.04em" };
const sideDivider: React.CSSProperties = { height: 1, background: "#e5e7eb", margin: "0.25rem 0" };
const sideBtnPrimary: React.CSSProperties = {
  display: "block", textAlign: "center", padding: "0.75rem",
  background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none",
  fontWeight: 700, fontSize: "0.9rem",
};
const sideBtnOutline: React.CSSProperties = {
  display: "block", textAlign: "center", padding: "0.7rem",
  background: "#fff", color: "#111", border: "1.5px solid #d1d5db",
  borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem",
};
const sideFact: React.CSSProperties = {
  background: "#f9fafb", borderRadius: 10, padding: "0.85rem 1rem",
  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem",
  marginTop: "0.25rem",
};
const sideFactNum: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 900, color: "#111" };
const sideFactLabel: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", textAlign: "center" };
