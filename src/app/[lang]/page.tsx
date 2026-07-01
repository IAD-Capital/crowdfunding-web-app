import { getSession } from "@/lib/session";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import PublicShell from "@/components/PublicShell";
import CatalogSection from "@/components/CatalogSection";
import InvestmentSimulator from "@/components/InvestmentSimulator";
import AuthCTASection from "@/components/AuthCTASection";
import Link from "next/link";
import Image from "next/image";
import { FileCheck2, Eye, Activity, ShieldCheck } from "lucide-react";
import db from "@/lib/db";
import type { Development, Unit } from "@/components/CatalogSection";
import type { TierThresholds } from "@/lib/investmentTiers";

type DevRow = Omit<Development, "unit_count"> & { unit_count: number; completion_date: Date | string | null };
type FeaturedRow = Omit<DevRow, "description"> & { zone_price_per_m2: number | string | null };
type UnitRow = Omit<Unit, "price_usd" | "current_price_usd" | "available_pct" | "group_expires_at"> & {
  price_usd: number | string;
  current_price_usd: number | string | null;
  available_pct: number | string;
  group_expires_at: Date | string | null;
};

const TRUST_ITEMS = [
  { Icon: FileCheck2, title: "Escrituración legal", desc: "Cada inversión se formaliza con respaldo notarial y documentación a tu nombre." },
  { Icon: Eye, title: "Transparencia total", desc: "Conocé el detalle de cada proyecto, costos y proyecciones antes de invertir." },
  { Icon: Activity, title: "Seguimiento en vivo", desc: "Mirá el avance de obra y el estado de tu cartera en tiempo real desde la app." },
  { Icon: ShieldCheck, title: "Retiro con aprobación", desc: "Solicitá el retiro de tu inversión mediante un proceso claro y supervisado." },
];

export default async function Home({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const [session] = await Promise.all([getSession(), getDictionary(lang)]);

  const isInvestor = session?.role === "investor";

  const [tierRow] = await db<TierThresholds[]>`
    SELECT bronze_from, silver_from, gold_from, platinum_from FROM app_settings WHERE id = 1
  `;
  const tierThresholds: TierThresholds = tierRow
    ? {
        bronze_from: Number(tierRow.bronze_from),
        silver_from: Number(tierRow.silver_from),
        gold_from: Number(tierRow.gold_from),
        platinum_from: Number(tierRow.platinum_from),
      }
    : { bronze_from: 5000, silver_from: 10000, gold_from: 25000, platinum_from: 150000 };

  const developments = await db<DevRow[]>`
    SELECT d.id, d.name, d.address, d.description, d.status,
           d.completion_date, d.amenities, d.images,
           d.developer_id, dv.name AS developer_name,
           COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    LEFT JOIN developers dv ON dv.id = d.developer_id
    WHERE d.status = 'active' AND d.visible = true
    GROUP BY d.id, dv.name
    ORDER BY d.updated_at DESC
  `;

  const units = await db<UnitRow[]>`
    SELECT u.id, u.development_id, u.identifier, u.floor,
           u.total_m2, u.covered_m2, u.rooms, u.bedrooms,
           u.orientation, u.price_usd, u.current_price_usd, u.status, u.images, u.description,
           100 - COALESCE((
             SELECT SUM(percentage) FROM investments
             WHERE unit_id = u.id AND status = 'approved'
           ), 0) AS available_pct,
           CASE WHEN u.group_duration_months IS NOT NULL THEN
             (SELECT MIN(i2.created_at) + (u.group_duration_months || ' months')::interval
              FROM investments i2 WHERE i2.unit_id = u.id AND i2.status = 'approved')
           ELSE NULL END AS group_expires_at
    FROM units u
    JOIN developments d ON d.id = u.development_id
    WHERE d.status = 'active' AND d.visible = true
    ORDER BY u.updated_at DESC
  `;

  const featuredRows = await db<(FeaturedRow & { developer_name: string | null })[]>`
    SELECT d.id, d.name, d.address, d.status,
           d.completion_date, d.amenities, d.images, d.zone_price_per_m2,
           dv.name AS developer_name,
           COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    LEFT JOIN developers dv ON dv.id = d.developer_id
    WHERE d.featured = true AND d.status = 'active' AND d.visible = true
    GROUP BY d.id, dv.name
    ORDER BY d.updated_at DESC
  `;
  const featuredDev = featuredRows[0] ?? null;
  const featuredUnits = featuredDev ? units.filter((u) => u.development_id === featuredDev.id) : [];
  const featuredMinPrice = featuredUnits.length > 0
    ? Math.min(...featuredUnits.map((u) => Number(u.price_usd)))
    : null;

  // Price per m² (own), averaged over units that have m² recorded — never a return promise, just sqm pricing
  const avgPricePerM2 = (list: { price_usd: number | string; total_m2?: number | string | null }[]): number | null => {
    const valid = list.filter((u) => u.total_m2 != null && Number(u.total_m2) > 0);
    if (valid.length === 0) return null;
    const total = valid.reduce((sum, u) => sum + Number(u.price_usd) / Number(u.total_m2), 0);
    return total / valid.length;
  };
  const overallPricePerM2 = avgPricePerM2(units);
  const featuredPricePerM2 = avgPricePerM2(featuredUnits);
  const featuredZonePricePerM2 = featuredDev?.zone_price_per_m2 != null ? Number(featuredDev.zone_price_per_m2) : null;
  const fmtPerM2 = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}/m²`;

  const serialized = {
    developments: developments.map((d) => ({
      ...d,
      completion_date: d.completion_date ? new Date(d.completion_date).toISOString() : null,
    })),
    units: units.map((u) => ({
      ...u,
      price_usd: u.price_usd != null ? Number(u.price_usd) : null,
      current_price_usd: u.current_price_usd != null ? Number(u.current_price_usd) : null,
      available_pct: Number(u.available_pct),
      group_expires_at: u.group_expires_at ? new Date(u.group_expires_at as string).toISOString() : null,
    })),
  };

  // Unit IDs the current investor already invested in (to block re-investment)
  const myInvestedUnitIds: number[] = isInvestor
    ? (await db`
        SELECT DISTINCT unit_id FROM investments
        WHERE user_id = ${Number(session!.sub)} AND status IN ('pending', 'approved')
      `).map((r) => Number(r.unit_id))
    : [];

  const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;
  const fmtMonthYear = (d: string | Date | null) =>
    d ? new Date(d).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }) : null;

  return (
    <PublicShell lang={lang}>
      {/* ─── Hero ──────────────────────────────────── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 860px) {
          .hero-inner { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .hero-visual { justify-self: stretch !important; }
        }
        @media (max-width: 760px) {
          .stats-strip { grid-template-columns: 1fr 1fr !important; }
          .stats-strip > div:nth-child(2) { border-right: none !important; }
          .trust-grid { grid-template-columns: 1fr 1fr !important; }
          .featured-card { grid-template-columns: 1fr !important; }
          .how-grid { grid-template-columns: 1fr !important; }
          .hero-chip-return { top: -12px !important; right: 8px !important; }
          .hero-chip-min { bottom: -12px !important; left: 8px !important; }
        }
      `,
        }}
      />
      <section style={hero}>
        <div style={heroInner} className="hero-inner">
          <div style={heroText}>
            {isInvestor ? (
              <span style={heroBadge}>
                <span style={heroBadgeDot} />
                Bienvenido, {session!.fullName} 👋
              </span>
            ) : (
              <span style={heroBadge}>
                <span style={heroBadgeDot} />
                {developments.length} emprendimiento{developments.length !== 1 ? "s" : ""} activo{developments.length !== 1 ? "s" : ""} · invertí desde el 5%
              </span>
            )}
            <h1 style={heroTitle}>Invertí en bienes raíces desde donde estés</h1>
            <p style={heroSubtitle}>
              Accedé a los mejores emprendimientos inmobiliarios y comprá desde un{" "}
              <strong style={{ color: "var(--c-ink)" }}>5%</strong> de una unidad funcional. Simple, seguro y rentable.
            </p>
            <div style={heroCta}>
              {!session ? (
                <>
                  <Link href={`/${lang}/signup`} style={btnPrimary}>
                    Empezar a invertir
                  </Link>
                  <Link href={`/${lang}/login`} style={btnOutline}>
                    Iniciar sesión
                  </Link>
                </>
              ) : isInvestor ? (
                <a href="#catalogo" style={btnPrimary}>
                  Ver oportunidades
                </a>
              ) : null}
            </div>
            <div style={heroTrust}>
              <span style={heroTrustItem}><span style={heroTrustCheck}>✓</span>Escrituración legal</span>
              <span style={heroTrustItem}><span style={heroTrustCheck}>✓</span>Transparencia total</span>
            </div>
          </div>

          <div style={heroVisual} className="hero-visual">
            <div style={heroImageFrame}>
              {featuredDev?.images?.[0] ? (
                <Image src={featuredDev.images[0]} alt={featuredDev.name} fill style={{ objectFit: "cover" }} priority />
              ) : (
                <div style={heroImagePlaceholder} />
              )}
              {featuredDev && (
                <span style={heroImageTag}>{featuredDev.name} · {featuredDev.address}</span>
              )}
            </div>
            <div style={heroChipReturn} className="hero-chip-return">
              <div style={heroChipLabel}>Valor m²</div>
              <div style={heroChipValue}>
                {featuredPricePerM2 != null ? fmtPerM2(featuredPricePerM2) : "—"}
              </div>
            </div>
            <div style={heroChipMin} className="hero-chip-min">
              <div style={heroChipMinLabel}>Entrada mínima</div>
              <div style={heroChipMinValue}>
                {featuredMinPrice != null ? fmtUsd(featuredMinPrice * 0.05) : "USD 5.000"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─────────────────────────────── */}
      <section style={statsSection}>
        <div style={statsCard} className="stats-strip">
          <div style={statCell}>
            <div style={statNum}>{developments.length}</div>
            <div style={statLabel}>Emprendimientos activos</div>
          </div>
          <div style={statCell}>
            <div style={statNum}>{units.length}</div>
            <div style={statLabel}>Unidades disponibles</div>
          </div>
          <div style={statCell}>
            <div style={{ ...statNum, color: "var(--c-accent)" }}>5%</div>
            <div style={statLabel}>Mínimo de inversión</div>
          </div>
          <div style={{ ...statCell, borderRight: "none" }}>
            <div style={{ ...statNum, color: "var(--c-positive)" }}>
              {overallPricePerM2 != null ? fmtPerM2(overallPricePerM2) : "—"}
            </div>
            <div style={statLabel}>Valor m² promedio <span style={{ color: "var(--c-text-faint)" }}>· en cartera</span></div>
          </div>
        </div>
      </section>

      {/* ─── Trust band ──────────────────────────────── */}
      <section style={trustSection}>
        <div style={trustHeader}>
          <div style={eyebrow}>Por qué IAD Capital</div>
          <h2 style={trustTitle}>Tu inversión, protegida en cada paso</h2>
        </div>
        <div style={trustGrid} className="trust-grid">
          {TRUST_ITEMS.map(({ Icon, title, desc }) => (
            <div key={title} style={trustCard}>
              <div style={trustIconWrap}>
                <Icon size={20} color="var(--c-accent)" strokeWidth={2} />
              </div>
              <h3 style={trustCardTitle}>{title}</h3>
              <p style={trustCardDesc}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Featured emprendimiento ─────────────────── */}
      {featuredDev && (
        <section id="emprendimientos" style={featuredSection}>
          <div style={featuredHeader}>
            <div>
              <h2 style={featuredTitle}>Emprendimientos destacados</h2>
              <p style={featuredSub}>Oportunidades seleccionadas en las mejores ubicaciones</p>
            </div>
            <a href="#catalogo" style={featuredAllLink}>Ver todos →</a>
          </div>

          <div style={featuredCard} className="featured-card">
            <div style={featuredImageWrap}>
              {featuredDev.images?.[0] ? (
                <Image src={featuredDev.images[0]} alt={featuredDev.name} fill style={{ objectFit: "cover" }} />
              ) : (
                <div style={featuredImagePlaceholder} />
              )}
              <span style={featuredStatusBadge}>Disponible</span>
            </div>
            <div style={featuredBody}>
              <div style={featuredDeveloperLine}>
                {featuredDev.developer_name ? `Desarrolladora ${featuredDev.developer_name} · ` : ""}{featuredDev.address}
              </div>
              <h3 style={featuredName}>{featuredDev.name}</h3>
              <div style={featuredAddrCaps}>{featuredDev.address.toUpperCase()}</div>

              <div style={featuredChipsRow}>
                <span style={featuredChip}>🏠 {featuredDev.unit_count} unidad{featuredDev.unit_count !== 1 ? "es" : ""}</span>
                {fmtMonthYear(featuredDev.completion_date) && (
                  <span style={featuredChip}>📅 Entrega {fmtMonthYear(featuredDev.completion_date)}</span>
                )}
                {featuredDev.amenities?.slice(0, 3).map((a) => (
                  <span key={a} style={featuredChip}>{a}</span>
                ))}
              </div>

              <div style={featuredPriceRow}>
                <div>
                  <div style={featuredPriceLabel}>Desde</div>
                  <div style={featuredPriceValue}>{featuredMinPrice != null ? fmtUsd(featuredMinPrice) : "Consultar"}</div>
                </div>
                <div>
                  <div style={featuredPriceLabel}>Valor m²</div>
                  <div style={{ ...featuredPriceValue, color: "var(--c-positive)" }}>
                    {featuredPricePerM2 != null ? fmtPerM2(featuredPricePerM2) : "—"}
                  </div>
                </div>
                {featuredZonePricePerM2 != null && (
                  <div>
                    <div style={featuredPriceLabel}>Valor m² zona</div>
                    <div style={featuredPriceValue}>{fmtPerM2(featuredZonePricePerM2)}</div>
                  </div>
                )}
              </div>

              <Link href={`/${lang}/emprendimientos/${featuredDev.id}`} style={featuredCta}>
                Ver emprendimiento →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── How it works ───────────────────────────── */}
      <section id="como-funciona" style={howSection}>
        <div style={howInner}>
          <div style={howHeader}>
            <div style={{ ...eyebrow, color: "#7fa0ff" }}>Cómo funciona</div>
            <h2 style={howTitle}>Invertí en tres pasos simples</h2>
          </div>
          <div style={howGrid} className="how-grid">
            {[
              { n: "01", title: "Elegí tu unidad", desc: "Explorá nuestro catálogo de departamentos en emprendimientos seleccionados." },
              { n: "02", title: "Definí tu porcentaje", desc: "Invertí desde el 5% hasta el 100% del valor de la unidad funcional." },
              { n: "03", title: "Formalizá tu inversión", desc: "Completá el proceso de manera segura y comenzá a generar rendimientos." },
            ].map((s) => (
              <div key={s.n} style={howCard}>
                <span style={howNum}>{s.n}</span>
                <h3 style={howCardTitle}>{s.title}</h3>
                <p style={howCardDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Simulador de inversión ─────────────────── */}
      <div id="simulador">
        <InvestmentSimulator
          developments={serialized.developments as Parameters<typeof InvestmentSimulator>[0]["developments"]}
          units={serialized.units as Parameters<typeof InvestmentSimulator>[0]["units"]}
          lang={lang}
        />
      </div>

      {/* ─── Full catalog ───────────────────────────── */}
      <div id="catalogo">
        <CatalogSection
          developments={serialized.developments as Parameters<typeof CatalogSection>[0]["developments"]}
          units={serialized.units as Parameters<typeof CatalogSection>[0]["units"]}
          isInvestor={isInvestor}
          myInvestedUnitIds={myInvestedUnitIds}
          lang={lang}
          tierThresholds={tierThresholds}
        />
      </div>

      {/* ─── Auth CTA (only for unauthenticated visitors) ── */}
      {!session && <AuthCTASection lang={lang} />}
    </PublicShell>
  );
}

/* ─── Styles ────────────────────────────────────── */

/* Hero */
const hero: React.CSSProperties = {
  background: "var(--c-bg)", overflowX: "hidden",
  marginTop: -92, paddingTop: "calc(72px + 92px)", paddingBottom: "2.5rem",
  paddingLeft: "1.5rem", paddingRight: "1.5rem",
};
const heroInner: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto",
  display: "grid", gridTemplateColumns: "1.05fr 0.95fr",
  gap: "3.5rem", alignItems: "center",
};
const heroText: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.4rem" };
const heroBadge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.5rem", width: "fit-content",
  background: "var(--c-positive-light)", color: "var(--c-positive)", borderRadius: 999,
  padding: "0.45rem 0.85rem", fontSize: "0.8rem", fontWeight: 600,
};
const heroBadgeDot: React.CSSProperties = { width: 7, height: 7, borderRadius: "50%", background: "var(--c-positive)", display: "inline-block" };
const heroTitle: React.CSSProperties = {
  fontSize: "clamp(2.1rem, 4.5vw, 3.4rem)", fontWeight: 800,
  lineHeight: 1.06, letterSpacing: "-0.035em", margin: 0, color: "var(--c-ink)",
};
const heroSubtitle: React.CSSProperties = {
  fontSize: "1.1rem", color: "var(--c-text-secondary)", lineHeight: 1.55, maxWidth: 480, margin: 0,
};
const heroCta: React.CSSProperties = { display: "flex", gap: "0.85rem", flexWrap: "wrap" };
const btnPrimary: React.CSSProperties = {
  padding: "0.9rem 1.6rem", background: "var(--c-accent)", color: "#fff",
  borderRadius: 11, textDecoration: "none", fontWeight: 600, fontSize: "0.98rem",
  boxShadow: "0 10px 24px rgba(27,77,224,0.26)",
};
const btnOutline: React.CSSProperties = {
  padding: "0.9rem 1.6rem", background: "var(--c-surface)", color: "var(--c-ink)",
  border: "1px solid var(--c-border-input)", borderRadius: 11,
  textDecoration: "none", fontWeight: 600, fontSize: "0.98rem",
};
const heroTrust: React.CSSProperties = { display: "flex", alignItems: "center", gap: "1.1rem", flexWrap: "wrap", color: "var(--c-text-tertiary)", fontSize: "0.85rem", fontWeight: 500, marginTop: "0.4rem" };
const heroTrustItem: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.5rem" };
const heroTrustCheck: React.CSSProperties = {
  width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--c-positive)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "var(--c-positive)", fontSize: "0.65rem", fontWeight: 800,
};

/* Hero visual */
const heroVisual: React.CSSProperties = { position: "relative" };
const heroImageFrame: React.CSSProperties = {
  position: "relative", aspectRatio: "4 / 4.4", borderRadius: 22, overflow: "hidden",
  boxShadow: "0 30px 60px -20px rgba(14,23,38,0.32)", border: "1px solid var(--c-border)",
  background: "linear-gradient(135deg, #e8eef7, #dfe7f2)",
};
const heroImagePlaceholder: React.CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(135deg, #e8eef7, #dfe7f2)" };
const heroImageTag: React.CSSProperties = {
  position: "absolute", top: 16, left: 16, background: "rgba(14,23,38,0.74)", backdropFilter: "blur(6px)",
  color: "#fff", padding: "0.5rem 0.8rem", borderRadius: 9, fontSize: "0.8rem", fontWeight: 600,
};
const heroChipReturn: React.CSSProperties = {
  position: "absolute", top: -18, right: -10, background: "var(--c-surface)", border: "1px solid var(--c-border)",
  borderRadius: 14, padding: "0.85rem 1.1rem", boxShadow: "0 18px 38px -14px rgba(14,23,38,0.28)",
};
const heroChipLabel: React.CSSProperties = { fontSize: "0.72rem", color: "var(--c-text-tertiary)", fontWeight: 600, marginBottom: "0.1rem" };
const heroChipValue: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 800, color: "var(--c-positive)", letterSpacing: "-0.02em" };
const heroChipUnit: React.CSSProperties = { fontSize: "0.85rem", color: "var(--c-text-secondary)", fontWeight: 600, fontFamily: "var(--font-body)" };
const heroChipMin: React.CSSProperties = {
  position: "absolute", bottom: -20, left: -10, background: "var(--c-ink)", color: "#fff",
  borderRadius: 14, padding: "0.85rem 1.1rem", boxShadow: "0 18px 38px -14px rgba(14,23,38,0.4)",
};
const heroChipMinLabel: React.CSSProperties = { fontSize: "0.72rem", color: "var(--c-text-on-dark)", fontWeight: 600, marginBottom: "0.1rem" };
const heroChipMinValue: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.02em" };

/* Stats strip */
const statsSection: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.5rem 3.5rem" };
const statsCard: React.CSSProperties = {
  background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 18,
  padding: "0.4rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
};
const statCell: React.CSSProperties = { padding: "1.4rem 1.6rem", borderRight: "1px solid var(--c-border-soft)" };
const statNum: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "2.1rem", fontWeight: 800, color: "var(--c-ink)", letterSpacing: "-0.03em" };
const statLabel: React.CSSProperties = { fontSize: "0.85rem", color: "var(--c-text-secondary)", fontWeight: 500, marginTop: "0.1rem" };

/* Trust band */
const trustSection: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0.5rem 1.5rem 4rem" };
const eyebrow: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--c-accent)", textTransform: "uppercase", marginBottom: "0.7rem" };
const trustHeader: React.CSSProperties = { textAlign: "center", maxWidth: 620, margin: "0 auto 2.75rem" };
const trustTitle: React.CSSProperties = { fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.025em", margin: 0, color: "var(--c-ink)" };
const trustGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" };
const trustCard: React.CSSProperties = { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 16, padding: "1.6rem" };
const trustIconWrap: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 11, background: "var(--c-accent-light)",
  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.1rem",
};
const trustCardTitle: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--c-ink)" };
const trustCardDesc: React.CSSProperties = { fontSize: "0.9rem", lineHeight: 1.5, color: "var(--c-text-secondary)", margin: 0 };

/* Featured */
const featuredSection: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.5rem 4rem" };
const featuredHeader: React.CSSProperties = { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1.5rem", flexWrap: "wrap" };
const featuredTitle: React.CSSProperties = { fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 0.5rem", color: "var(--c-ink)" };
const featuredSub: React.CSSProperties = { fontSize: "1rem", color: "var(--c-text-secondary)", margin: 0 };
const featuredAllLink: React.CSSProperties = { textDecoration: "none", color: "var(--c-accent)", fontWeight: 600, fontSize: "0.95rem" };
const featuredCard: React.CSSProperties = {
  background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 22, overflow: "hidden",
  display: "grid", gridTemplateColumns: "1.15fr 1fr", boxShadow: "0 24px 50px -28px rgba(14,23,38,0.22)",
};
const featuredImageWrap: React.CSSProperties = { position: "relative", minHeight: 420, background: "linear-gradient(135deg, #e8eef7, #dfe7f2)" };
const featuredImagePlaceholder: React.CSSProperties = { position: "absolute", inset: 0 };
const featuredStatusBadge: React.CSSProperties = {
  position: "absolute", top: 18, left: 18, background: "var(--c-positive)", color: "#fff",
  fontSize: "0.78rem", fontWeight: 700, padding: "0.4rem 0.75rem", borderRadius: 999,
};
const featuredBody: React.CSSProperties = { padding: "2.4rem 2.5rem", display: "flex", flexDirection: "column" };
const featuredDeveloperLine: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 600, color: "var(--c-text-tertiary)", marginBottom: "0.5rem" };
const featuredName: React.CSSProperties = { fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 0.35rem", color: "var(--c-ink)" };
const featuredAddrCaps: React.CSSProperties = { fontSize: "0.92rem", color: "var(--c-text-secondary)", marginBottom: "1.5rem" };
const featuredChipsRow: React.CSSProperties = { display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" };
const featuredChip: React.CSSProperties = {
  fontSize: "0.82rem", fontWeight: 600, color: "var(--c-ink)", background: "var(--c-chip-bg)",
  border: "1px solid var(--c-border)", padding: "0.5rem 0.8rem", borderRadius: 9,
};
const featuredPriceRow: React.CSSProperties = {
  display: "flex", gap: "2rem", padding: "1.25rem 0", borderTop: "1px solid var(--c-border-soft)",
  borderBottom: "1px solid var(--c-border-soft)", marginBottom: "1.5rem",
};
const featuredPriceLabel: React.CSSProperties = { fontSize: "0.78rem", color: "var(--c-text-tertiary)", fontWeight: 600, marginBottom: "0.2rem" };
const featuredPriceValue: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--c-ink)" };
const featuredCta: React.CSSProperties = {
  marginTop: "auto", textDecoration: "none", background: "var(--c-accent)", color: "#fff",
  fontSize: "0.95rem", fontWeight: 600, padding: "0.9rem", borderRadius: 11, textAlign: "center",
  boxShadow: "0 10px 22px rgba(27,77,224,0.22)",
};

/* How it works */
const howSection: React.CSSProperties = { background: "var(--c-ink)", marginTop: "1.5rem" };
const howInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "5rem 1.5rem" };
const howHeader: React.CSSProperties = { maxWidth: 560, marginBottom: "3rem" };
const howTitle: React.CSSProperties = { fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, color: "#fff", lineHeight: 1.1 };
const howGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" };
const howCard: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.6rem",
  padding: "2rem", borderRadius: 18, border: "1px solid var(--c-ink-border)",
  background: "var(--c-ink-soft)",
};
const howNum: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 800, color: "#7fa0ff", marginBottom: "2.5rem" };
const howCardTitle: React.CSSProperties = { fontSize: "1.3rem", fontWeight: 700, margin: 0, color: "#fff" };
const howCardDesc: React.CSSProperties = { color: "var(--c-text-on-dark)", fontSize: "0.95rem", lineHeight: 1.55, margin: 0 };
