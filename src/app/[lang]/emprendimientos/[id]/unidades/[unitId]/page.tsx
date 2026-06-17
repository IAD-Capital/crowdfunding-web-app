import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import db from "@/lib/db";
import PublicShell from "@/components/PublicShell";
import ImageGallery from "@/components/admin/ImageGallery";
import BuyPanel from "@/components/BuyPanel";
import Link from "next/link";
import Image from "next/image";

export default async function PublicUnitPage({
  params,
}: {
  params: { lang: string; id: string; unitId: string };
}) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();
  const isInvestor = session?.role === "investor" || session?.role === "superadmin";

  const [unit] = await db`
    SELECT u.*,
      100 - COALESCE((
        SELECT SUM(percentage) FROM investments
        WHERE unit_id = u.id AND status = 'active'
      ), 0) AS available_pct
    FROM units u
    WHERE u.id = ${params.unitId} AND u.development_id = ${params.id}
  `;
  if (!unit) notFound();

  const [dev] = await db`SELECT id, name, address, images FROM developments WHERE id = ${params.id}`;
  if (!dev) notFound();

  const STATUS_UNIT: Record<string, { bg: string; fg: string; label: string }> = {
    available: { bg: "#dcfce7", fg: "#166534", label: "Disponible" },
    partial:   { bg: "#fef9c3", fg: "#854d0e", label: "Parcial" },
    sold:      { bg: "#fee2e2", fg: "#991b1b", label: "Vendida" },
  };
  const sc = STATUS_UNIT[unit.status] ?? { bg: "#f3f4f6", fg: "#374151", label: unit.status };

  return (
    <PublicShell lang={lang}>
      {/* Hero cover */}
      <div style={heroCover}>
        {unit.images?.[0] ? (
          <Image src={unit.images[0]} alt={unit.identifier} fill style={{ objectFit: "cover" }} priority />
        ) : dev.images?.[0] ? (
          <Image src={dev.images[0]} alt={dev.name} fill style={{ objectFit: "cover" }} priority />
        ) : (
          <div style={heroPlaceholder}><span style={{ fontSize: "4rem", opacity: 0.1 }}>🏠</span></div>
        )}
        <div style={heroGradient} />
        <div style={heroContent}>
          <div style={heroInner}>
            <Link href={`/${lang}/emprendimientos/${dev.id}`} style={backLink}>
              ← {dev.name}
            </Link>
            <span style={{ ...statusPill, background: sc.bg, color: sc.fg }}>{sc.label}</span>
            <h1 style={heroTitle}>{unit.identifier}</h1>
            <p style={heroSub}>📍 {dev.address}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={body}>
        <div style={bodyInner}>
          {/* Left */}
          <div style={leftCol}>
            {/* Info grid */}
            <div style={infoGrid}>
              {unit.floor != null && <InfoCard label="Piso" value={String(unit.floor)} />}
              {unit.total_m2 != null && <InfoCard label="Superficie total" value={`${unit.total_m2} m²`} />}
              {unit.covered_m2 != null && <InfoCard label="Cubierta" value={`${unit.covered_m2} m²`} />}
              {unit.uncovered_m2 != null && <InfoCard label="Descubierta" value={`${unit.uncovered_m2} m²`} />}
              {unit.rooms != null && <InfoCard label="Ambientes" value={String(unit.rooms)} />}
              {unit.bedrooms != null && <InfoCard label="Dormitorios" value={String(unit.bedrooms)} />}
              {unit.bathrooms != null && <InfoCard label="Baños" value={String(unit.bathrooms)} />}
              {unit.orientation && <InfoCard label="Orientación" value={unit.orientation} />}
            </div>

            {unit.description && (
              <div>
                <h2 style={sectionTitle}>Descripción</h2>
                <p style={descText}>{unit.description}</p>
              </div>
            )}

            {unit.images?.length > 0 && (
              <div>
                <h2 style={sectionTitle}>Galería</h2>
                <ImageGallery images={unit.images} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside style={sidebar}>
            <div style={sideCard}>
              <p style={sidePriceLabel}>Precio</p>
              <p style={sidePrice}>
                {unit.price_usd != null
                  ? `USD ${Number(unit.price_usd).toLocaleString("es-AR")}`
                  : "Consultar"}
              </p>

              {Number(unit.available_pct) < 100 && unit.status !== "sold" && (
                <p style={availableNote}>
                  {Number(unit.available_pct)}% disponible para invertir
                </p>
              )}

              <div style={sideDivider} />

              {isInvestor && unit.status !== "sold" && unit.price_usd != null ? (
                <BuyPanel
                  unitId={unit.id}
                  priceUsd={Number(unit.price_usd)}
                  identifier={unit.identifier}
                  lang={lang}
                  availablePct={Number(unit.available_pct)}
                />
              ) : unit.status === "sold" ? (
                <p style={soldNote}>Esta unidad ya fue vendida en su totalidad.</p>
              ) : !session ? (
                <>
                  <Link href={`/${lang}/signup`} style={sideBtnPrimary}>Invertir en esta unidad</Link>
                  <Link href={`/${lang}/login`} style={sideBtnOutline}>Ya tengo cuenta</Link>
                </>
              ) : null}

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

const heroCover: React.CSSProperties = { position: "relative", height: 360, background: "#111" };
const heroPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" };
const heroGradient: React.CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)" };
const heroContent: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" };
const heroInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", width: "100%", padding: "0 1.5rem 2.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" };
const backLink: React.CSSProperties = { color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.85rem", marginBottom: "0.25rem" };
const statusPill: React.CSSProperties = { display: "inline-block", width: "fit-content", borderRadius: 999, padding: "0.2rem 0.75rem", fontSize: "0.78rem", fontWeight: 700 };
const heroTitle: React.CSSProperties = { fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.03em" };
const heroSub: React.CSSProperties = { color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", margin: 0 };

const body: React.CSSProperties = { background: "#f9fafb", padding: "3rem 1.5rem" };
const bodyInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 320px", gap: "2.5rem", alignItems: "start" };
const leftCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "2.5rem" };
const infoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" };
const infoCard: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.85rem 1rem" };
const sectionTitle: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 800, margin: "0 0 1rem", letterSpacing: "-0.02em" };
const descText: React.CSSProperties = { color: "#374151", lineHeight: 1.7, margin: 0 };

const sidebar: React.CSSProperties = { position: "sticky", top: 80 };
const sideCard: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" };
const sidePriceLabel: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
const sidePrice: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.04em" };
const availableNote: React.CSSProperties = { fontSize: "0.78rem", color: "#d97706", fontWeight: 600, margin: 0, background: "#fffbeb", borderRadius: 8, padding: "0.4rem 0.75rem" };
const soldNote: React.CSSProperties = { fontSize: "0.85rem", color: "#991b1b", background: "#fee2e2", borderRadius: 8, padding: "0.75rem", textAlign: "center", margin: 0 };
const sideDivider: React.CSSProperties = { height: 1, background: "#e5e7eb" };
const sideBtnPrimary: React.CSSProperties = { display: "block", textAlign: "center", padding: "0.75rem", background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" };
const sideBtnOutline: React.CSSProperties = { display: "block", textAlign: "center", padding: "0.7rem", background: "#fff", color: "#111", border: "1.5px solid #d1d5db", borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" };
const sideFact: React.CSSProperties = { background: "#f9fafb", borderRadius: 10, padding: "0.85rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" };
const sideFactNum: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 900, color: "#111" };
const sideFactLabel: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", textAlign: "center" };
