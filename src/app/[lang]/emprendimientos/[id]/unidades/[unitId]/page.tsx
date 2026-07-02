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
  // Only investors (not superadmin) can invest
  const canInvest = session?.role === "investor";
  const isAuthenticated = !!session;

  const [unit] = await db`
    SELECT u.*,
      100 - COALESCE((
        SELECT SUM(percentage) FROM investments
        WHERE unit_id = u.id AND status = 'approved'
      ), 0) AS available_pct,
      CASE WHEN u.group_duration_months IS NOT NULL THEN
        (SELECT MIN(i2.created_at) + (u.group_duration_months || ' months')::interval
         FROM investments i2 WHERE i2.unit_id = u.id AND i2.status = 'approved')
      ELSE NULL END AS group_expires_at
    FROM units u
    WHERE u.id = ${params.unitId} AND u.development_id = ${params.id}
  `;
  if (!unit) notFound();

  const isNumeric = /^\d+$/.test(params.id);
  const [dev] = isNumeric
    ? await db`SELECT id, name, address, images, visible, slug FROM developments WHERE id = ${params.id}`
    : await db`SELECT id, name, address, images, visible, slug FROM developments WHERE slug = ${params.id}`;
  if (!dev) notFound();
  if (!dev.visible && session?.role !== "superadmin") notFound();

  // Check if this investor already has a pending request or approved position in this unit
  const [myInvestment] = canInvest
    ? await db`
        SELECT id, status, percentage, amount_usd FROM investments
        WHERE unit_id = ${unit.id} AND user_id = ${Number(session!.sub)} AND status IN ('pending', 'approved')
      `
    : [null];

  // Co-investors: visible to investors only — anonymous, just the aggregate
  const [coInvestorAgg] = canInvest
    ? await db`
        SELECT COUNT(*)::int AS count, COALESCE(SUM(percentage), 0)::numeric AS total_pct
        FROM investments
        WHERE unit_id = ${unit.id}
          AND status = 'approved'
          AND user_id != ${Number(session!.sub)}
      `
    : [{ count: 0, total_pct: 0 }];

  const groupExpires = unit.group_expires_at ? new Date(unit.group_expires_at as string) : null;
  const groupExpired = groupExpires ? groupExpires < new Date() : false;

  const STATUS_UNIT: Record<string, { bg: string; fg: string; label: string }> = {
    available: { bg: "#dcfce7", fg: "#166534", label: "Disponible" },
    partial:   { bg: "#fef9c3", fg: "#854d0e", label: "Parcial" },
    sold:      { bg: "#fee2e2", fg: "#991b1b", label: "Vendida" },
  };
  const sc = STATUS_UNIT[unit.status] ?? { bg: "#f3f4f6", fg: "#374151", label: unit.status };

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(lang === "es" ? "es-AR" : "en-US", {
      day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
    });

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
            <Link href={`/${lang}/emprendimientos/${dev.slug ?? dev.id}`} style={backLink}>
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

            {/* Co-investors section — visible only to investors */}
            {canInvest && (
              <div>
                <h2 style={sectionTitle}>Grupo de inversión</h2>

                {/* Group expiration banner */}
                {groupExpires && (
                  <div style={{ ...groupBanner, ...(groupExpired ? groupBannerExpired : {}) }}>
                    <span style={{ fontWeight: 700 }}>
                      {groupExpired ? "⛔ Grupo cerrado" : "⏳ Cierre del grupo"}
                    </span>
                    <span style={{ opacity: 0.85 }}>
                      {groupExpired
                        ? `Venció el ${fmtDate(groupExpires)}`
                        : `Vence el ${fmtDate(groupExpires)}`}
                    </span>
                  </div>
                )}

                {coInvestorAgg.count === 0 ? (
                  <div style={emptyGroup}>
                    <span style={{ fontSize: "2rem", opacity: 0.15 }}>👥</span>
                    <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.9rem" }}>
                      Sos el primer inversor en esta unidad.
                    </p>
                  </div>
                ) : (
                  <div style={coList}>
                    <p style={coListNote}>
                      {coInvestorAgg.count} inversor{coInvestorAgg.count !== 1 ? "es" : ""} en este grupo · {Number(coInvestorAgg.total_pct)}% invertido en total
                    </p>
                    <div style={coPctBar}>
                      <div style={{ ...coPctFill, width: `${Number(coInvestorAgg.total_pct)}%` }} />
                    </div>
                  </div>
                )}
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

              {canInvest && myInvestment ? (
                <div style={alreadyInvested}>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: "0.88rem" }}>
                    {myInvestment.status === "pending" ? "Solicitud pendiente de aprobación" : "Tu participación"}
                  </p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 900, letterSpacing: "-0.04em" }}>
                    {Number(myInvestment.percentage)}%
                  </p>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.82rem", color: myInvestment.status === "pending" ? "#92400e" : "#166534" }}>
                    USD {Number(myInvestment.amount_usd).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </p>
                  <a href={`/${lang}/wallet`} style={walletBtn}>Ver mi cartera →</a>
                </div>
              ) : canInvest && unit.status !== "sold" && unit.price_usd != null && !groupExpired ? (
                <BuyPanel
                  unitId={unit.id}
                  priceUsd={Number(unit.price_usd)}
                  identifier={unit.identifier}
                  lang={lang}
                  availablePct={Number(unit.available_pct)}
                />
              ) : canInvest && groupExpired ? (
                <p style={soldNote}>El grupo de inversión para esta unidad ya está cerrado.</p>
              ) : unit.status === "sold" ? (
                <p style={soldNote}>Esta unidad ya fue vendida en su totalidad.</p>
              ) : !isAuthenticated ? (
                <>
                  <Link href={`/${lang}/signup`} style={sideBtnPrimary}>Invertir en esta unidad</Link>
                  <Link href={`/${lang}/login`} style={sideBtnOutline}>Ya tengo cuenta</Link>
                </>
              ) : (
                // superadmin or other role: show info but no buy button
                <p style={{ fontSize: "0.82rem", color: "#6b7280", textAlign: "center", margin: 0 }}>
                  Solo los inversores pueden comprar participaciones.
                </p>
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

/* Group / co-investors */
const groupBanner: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.2rem",
  background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10,
  padding: "0.75rem 1rem", fontSize: "0.85rem", color: "#92400e", marginBottom: "1rem",
};
const groupBannerExpired: React.CSSProperties = {
  background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b",
};
const emptyGroup: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
  padding: "2rem", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
};
const coList: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" };
const coListNote: React.CSSProperties = { fontSize: "0.82rem", color: "#374151", margin: 0, fontWeight: 600 };
const coPctBar: React.CSSProperties = { height: 6, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" };
const coPctFill: React.CSSProperties = { height: "100%", background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: 999 };

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
const alreadyInvested: React.CSSProperties = { background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem", textAlign: "center" };
const walletBtn: React.CSSProperties = { marginTop: "0.5rem", padding: "0.45rem 1rem", background: "#111", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" };
