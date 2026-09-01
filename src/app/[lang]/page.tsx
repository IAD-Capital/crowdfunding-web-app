import { cache, Suspense } from "react";
import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import PublicShell from "@/components/PublicShell";
import CatalogSection from "@/components/CatalogSection";
import InvestmentSimulator from "@/components/InvestmentSimulator";
import AuthCTASection from "@/components/AuthCTASection";
import FeaturedUnitsHero, { type FeaturedUnit } from "@/components/FeaturedUnitsHero";
import ScrollReveal from "@/components/ScrollReveal";
import CountUpNumber from "@/components/CountUpNumber";
import Skeleton from "@/components/Skeleton";
import { FileCheck2, Eye, Activity, ShieldCheck } from "lucide-react";
import db from "@/lib/db";
import type { Development, Unit } from "@/components/CatalogSection";
import { MIN_ENTRY_PCT, type TierThresholds } from "@/lib/investmentTiers";

type DevRow = Omit<Development, "unit_count"> & { unit_count: number; completion_date: Date | string | null };
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

// Everything the DB-dependent sections need, fetched once per request and
// shared (via React's cache()) between the two independent Suspense
// boundaries below — so splitting the page into streamed chunks doesn't
// mean querying the DB twice.
const getHomeData = cache(async () => {
  const session = await getSession();
  const isInvestor = session?.role === "investor";

  const [
    [phoneRow],
    [tierRow],
    developments,
    units,
    featuredUnitRows,
    investedRows,
    favoriteRows,
  ] = await Promise.all([
    isInvestor
      ? db<{ phone: string | null }[]>`SELECT phone FROM users WHERE id = ${Number(session!.sub)}`
      : Promise.resolve([null]),
    db<TierThresholds[]>`
      SELECT bronze_from, silver_from, gold_from, platinum_from FROM app_settings WHERE id = 1
    `,
    db<DevRow[]>`
      SELECT d.id, d.name, d.address, d.description, d.status,
             d.completion_date, d.amenities, d.images, d.slug,
             d.developer_id, dv.name AS developer_name,
             COUNT(u.id)::int AS unit_count
      FROM developments d
      LEFT JOIN units u ON u.development_id = d.id
      LEFT JOIN developers dv ON dv.id = d.developer_id
      WHERE d.status = 'active' AND d.visible = true
      GROUP BY d.id, dv.name
      ORDER BY d.updated_at DESC
    `,
    db<UnitRow[]>`
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
    `,
    db<(FeaturedUnit & { price_usd: string | number; available_pct: string | number })[]>`
      SELECT u.id, u.identifier, u.images, u.price_usd, u.total_m2, u.rooms,
             d.id AS development_id, d.name AS development_name, d.address AS development_address,
             d.slug AS development_slug, d.amenities,
             100 - COALESCE((
               SELECT SUM(percentage) FROM investments
               WHERE unit_id = u.id AND status = 'approved'
             ), 0) AS available_pct
      FROM units u
      JOIN developments d ON d.id = u.development_id
      WHERE u.featured = true AND d.status = 'active' AND d.visible = true AND u.status != 'sold'
      ORDER BY u.featured_order
      LIMIT 8
    `,
    isInvestor
      ? db`
          SELECT DISTINCT unit_id FROM investments
          WHERE user_id = ${Number(session!.sub)} AND status IN ('pending', 'approved')
        `
      : Promise.resolve([]),
    session
      ? db`SELECT unit_id FROM favorites WHERE user_id = ${Number(session.sub)}`
      : Promise.resolve([]),
  ]);

  const hasPhone = !!phoneRow?.phone?.trim();
  const tierThresholds: TierThresholds = tierRow
    ? {
        bronze_from: Number(tierRow.bronze_from),
        silver_from: Number(tierRow.silver_from),
        gold_from: Number(tierRow.gold_from),
        platinum_from: Number(tierRow.platinum_from),
      }
    : { bronze_from: 5000, silver_from: 10000, gold_from: 25000, platinum_from: 150000 };
  const featuredUnits8: (FeaturedUnit & { available_pct: number })[] = featuredUnitRows.map((u) => ({
    ...u,
    price_usd: Number(u.price_usd),
    available_pct: Number(u.available_pct),
  }));
  const myInvestedUnitIds: number[] = investedRows.map((r) => Number(r.unit_id));
  const myFavoriteUnitIds: number[] = favoriteRows.map((r) => Number(r.unit_id));

  const investableUnits = units.filter((u) => u.status !== "sold");
  const minInvestUsd = investableUnits.length > 0
    ? Math.min(...investableUnits.map((u) => Number(u.price_usd))) * MIN_ENTRY_PCT
    : null;

  // Price per m² (own), averaged over units that have m² recorded — never a return promise, just sqm pricing
  const avgPricePerM2 = (list: { price_usd: number | string; total_m2?: number | string | null }[]): number | null => {
    const valid = list.filter((u) => u.total_m2 != null && Number(u.total_m2) > 0);
    if (valid.length === 0) return null;
    const total = valid.reduce((sum, u) => sum + Number(u.price_usd) / Number(u.total_m2), 0);
    return total / valid.length;
  };
  const overallPricePerM2 = avgPricePerM2(units);

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

  return {
    session, isInvestor, hasPhone, tierThresholds,
    units, featuredUnits8, myInvestedUnitIds, myFavoriteUnitIds,
    minInvestUsd, overallPricePerM2, serialized,
  };
});

export default function Home({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  return (
    <PublicShell lang={lang}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 760px) {
          .stats-strip { grid-template-columns: 1fr 1fr !important; }
          .stats-strip > div:nth-child(2) { border-right: none !important; }
          .trust-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .trust-card { padding: 2rem 1.6rem !important; }
          .how-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-strip { grid-template-columns: 1fr !important; }
          .stats-strip > div {
            border-right: none !important;
            border-bottom: 1px solid var(--c-border-soft) !important;
          }
          .stats-strip > div:last-child { border-bottom: none !important; }
        }
      `,
        }}
      />

      {/* ─── Featured units + stats — needs DB data, streams in on its own ── */}
      <Suspense fallback={<HeroStatsSkeleton />}>
        <HomeHeroAndStats lang={lang} />
      </Suspense>

      {/* ─── Trust band — static, no data dependency, renders immediately ── */}
      <section style={trustSection}>
        <ScrollReveal>
          <div style={trustHeader}>
            <div style={eyebrow}>Por qué IAD Capital</div>
            <h2 style={trustTitle}>Tu inversión, protegida en cada paso</h2>
          </div>
        </ScrollReveal>
        <div style={trustGrid} className="trust-grid">
          {TRUST_ITEMS.map(({ Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={i * 140}>
              <div style={trustCard} className="trust-card">
                <div style={trustIconWrap}>
                  <Icon size={20} color="var(--c-accent)" strokeWidth={2} />
                </div>
                <h3 style={trustCardTitle}>{title}</h3>
                <p style={trustCardDesc}>{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ─── How it works — static, renders immediately ─────────────────── */}
      <section id="how-it-works" style={howSection}>
        <div style={howInner}>
          <div style={howHeader}>
            <div style={{ ...eyebrow, color: "#7fa0ff" }}>Cómo funciona</div>
            <h2 style={howTitle}>Invertí en tres pasos simples</h2>
          </div>
          <div style={howGrid} className="how-grid">
            {[
              { n: "01", title: "Elegí tu unidad", desc: "Explorá nuestro catálogo de departamentos disponibles para invertir." },
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

      {/* ─── Simulator + catalog + auth CTA — needs DB data ──────────────── */}
      <Suspense fallback={<SimulatorCatalogSkeleton />}>
        <HomeSimulatorCatalogAndCTA lang={lang} />
      </Suspense>
    </PublicShell>
  );
}

async function HomeHeroAndStats({ lang }: { lang: Locale }) {
  const { session, isInvestor, units, featuredUnits8, minInvestUsd, overallPricePerM2 } = await getHomeData();

  return (
    <>
      {/* ─── Featured units ──────────────────────────── */}
      <div id="featured">
        <FeaturedUnitsHero
          units={featuredUnits8}
          lang={lang}
          minInvestUsd={minInvestUsd}
          totalUnitsCount={units.length}
          hasSession={!!session}
          isInvestor={isInvestor}
          fullName={session?.fullName}
        />
      </div>

      {/* ─── Stats strip ─────────────────────────────── */}
      <section style={statsSection}>
        <div style={statsCard} className="stats-strip">
          <div style={statCell}>
            <div style={statNum}><CountUpNumber value={units.length} delay={0} /></div>
            <div style={statLabel}>Unidades disponibles</div>
          </div>
          <div style={statCell}>
            <div style={{ ...statNum, color: "var(--c-accent)" }}>
              <CountUpNumber value={5} delay={100} suffix="%" />
            </div>
            <div style={statLabel}>Mínimo de inversión</div>
          </div>
          <div style={{ ...statCell, borderRight: "none" }}>
            <div style={{ ...statNum, color: "var(--c-positive)" }}>
              {overallPricePerM2 != null ? (
                <CountUpNumber value={overallPricePerM2} delay={200} prefix="USD " suffix="/m²" locale="es-AR" />
              ) : (
                "—"
              )}
            </div>
            <div style={statLabel}>Valor m² promedio <span style={{ color: "var(--c-text-faint)" }}>· en cartera</span></div>
          </div>
        </div>
      </section>
    </>
  );
}

async function HomeSimulatorCatalogAndCTA({ lang }: { lang: Locale }) {
  const { session, isInvestor, hasPhone, tierThresholds, serialized, featuredUnits8, myInvestedUnitIds, myFavoriteUnitIds } = await getHomeData();

  return (
    <>
      {/* ─── Simulador de inversión ─────────────────── */}
      <div id="simulator">
        <InvestmentSimulator units={featuredUnits8} lang={lang} />
      </div>

      {/* ─── Full catalog ───────────────────────────── */}
      <div id="catalog">
        <CatalogSection
          developments={serialized.developments as Parameters<typeof CatalogSection>[0]["developments"]}
          units={serialized.units as Parameters<typeof CatalogSection>[0]["units"]}
          isInvestor={isInvestor}
          hasPhone={hasPhone}
          myInvestedUnitIds={myInvestedUnitIds}
          isAuthenticated={!!session}
          myFavoriteUnitIds={myFavoriteUnitIds}
          lang={lang}
          tierThresholds={tierThresholds}
        />
      </div>

      {/* ─── Auth CTA (only for unauthenticated visitors) ── */}
      {!session && <AuthCTASection lang={lang} />}
    </>
  );
}

/* ─── Suspense fallbacks ────────────────────────── */

function HeroStatsSkeleton() {
  return (
    <div style={{ background: "var(--c-bg)" }}>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 1.5rem 2.5rem", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "3.5rem", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <Skeleton style={{ width: 220, height: 30 }} />
          <Skeleton style={{ width: "90%", height: 56 }} />
          <Skeleton style={{ width: "70%", height: 56 }} />
          <Skeleton style={{ width: "85%", height: 24, marginTop: "0.5rem" }} />
          <Skeleton style={{ width: "60%", height: 24 }} />
          <div style={{ display: "flex", gap: "0.85rem", marginTop: "0.5rem" }}>
            <Skeleton style={{ width: 180, height: 52, borderRadius: 11 }} />
            <Skeleton style={{ width: 160, height: 52, borderRadius: 11 }} />
          </div>
        </div>
        <Skeleton style={{ aspectRatio: "4 / 4.4", borderRadius: 22 }} />
      </section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 3.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", border: "1px solid var(--c-border)", borderRadius: 18, overflow: "hidden" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: "1.4rem 1.6rem", background: "var(--c-surface)" }}>
              <Skeleton style={{ width: 70, height: 34, marginBottom: "0.4rem" }} />
              <Skeleton style={{ width: "80%", height: 16 }} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SimulatorCatalogSkeleton() {
  return (
    <div style={{ background: "var(--c-bg)" }}>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "5rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <Skeleton style={{ width: 160, height: 20 }} />
          <Skeleton style={{ width: "80%", height: 34 }} />
          <Skeleton style={{ width: "95%", height: 18, marginTop: "0.5rem" }} />
          <Skeleton style={{ width: "70%", height: 18 }} />
        </div>
        <Skeleton style={{ height: 320, borderRadius: 18 }} />
      </section>
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem 4rem" }}>
        <Skeleton style={{ width: 260, height: 32, margin: "0 auto 0.6rem" }} />
        <Skeleton style={{ width: 360, height: 18, margin: "0 auto 1.75rem" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} style={{ height: 110, borderRadius: 14 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton style={{ height: 160, borderRadius: "14px 14px 0 0" }} />
              <div style={{ border: "1px solid var(--c-border)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "1.1rem 1.2rem" }}>
                <Skeleton style={{ width: "60%", height: 22, marginBottom: "0.5rem" }} />
                <Skeleton style={{ width: "85%", height: 14, marginBottom: "0.75rem" }} />
                <Skeleton style={{ width: "100%", height: 38 }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Styles ────────────────────────────────────── */

/* Stats strip */
const statsSection: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "1.5rem 1.5rem 3.5rem" };
const statsCard: React.CSSProperties = {
  background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 18,
  padding: "0.4rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
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
