import { getSession } from "@/lib/session";
import { getDictionary, isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import PublicShell from "@/components/PublicShell";
import CatalogSection from "@/components/CatalogSection";
import FeaturedSlider from "@/components/FeaturedSlider";
import AuthCTASection from "@/components/AuthCTASection";
import Link from "next/link";
import db from "@/lib/db";
import type { Development, Unit } from "@/components/CatalogSection";
import type { TierThresholds } from "@/lib/investmentTiers";

type DevRow = Omit<Development, "unit_count"> & { unit_count: number; completion_date: Date | string | null };
type FeaturedRow = Omit<DevRow, "description">;
type UnitRow = Omit<Unit, "price_usd" | "current_price_usd" | "available_pct" | "group_expires_at"> & {
  price_usd: number | string;
  current_price_usd: number | string | null;
  available_pct: number | string;
  group_expires_at: Date | string | null;
};

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
           COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    WHERE d.status = 'active'
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;

  const units = await db<UnitRow[]>`
    SELECT u.id, u.development_id, u.identifier, u.floor,
           u.total_m2, u.covered_m2, u.rooms, u.bedrooms,
           u.orientation, u.price_usd, u.current_price_usd, u.status, u.images, u.description,
           100 - COALESCE((
             SELECT SUM(percentage) FROM investments
             WHERE unit_id = u.id AND status = 'active'
           ), 0) AS available_pct,
           CASE WHEN u.group_duration_months IS NOT NULL THEN
             (SELECT MIN(i2.created_at) + (u.group_duration_months || ' months')::interval
              FROM investments i2 WHERE i2.unit_id = u.id AND i2.status = 'active')
           ELSE NULL END AS group_expires_at
    FROM units u
    JOIN developments d ON d.id = u.development_id
    WHERE d.status = 'active'
    ORDER BY u.price_usd ASC
  `;

  const featuredRows = await db<FeaturedRow[]>`
    SELECT d.id, d.name, d.address, d.status,
           d.completion_date, d.amenities, d.images,
           COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    WHERE d.featured = true AND d.status = 'active'
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;
  const featured = featuredRows;

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
        WHERE user_id = ${Number(session!.sub)} AND status = 'active'
      `).map((r) => Number(r.unit_id))
    : [];

  return (
    <PublicShell lang={lang}>
      {/* ─── Hero ──────────────────────────────────── */}
      <section style={hero}>
        <div style={heroInner}>
          <div style={heroText}>
            {isInvestor && (
              <span style={heroBadge}>
                Bienvenido, {session!.fullName} 👋
              </span>
            )}
            <h1 style={heroTitle}>
              Invertí en bienes raíces desde donde estés
            </h1>
            <p style={heroSubtitle}>
              Accedé a los mejores emprendimientos inmobiliarios y comprá desde un{" "}
              <strong>5%</strong> de una unidad funcional. Simple, seguro y rentable.
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
            <div style={heroStats}>
              <div style={heroStat}>
                <span style={heroStatNum}>{developments.length}</span>
                <span style={heroStatLabel}>Emprendimientos activos</span>
              </div>
              <div style={heroStatDivider} />
              <div style={heroStat}>
                <span style={heroStatNum}>{units.length}</span>
                <span style={heroStatLabel}>Unidades disponibles</span>
              </div>
              <div style={heroStatDivider} />
              <div style={heroStat}>
                <span style={heroStatNum}>5%</span>
                <span style={heroStatLabel}>Mínimo de inversión</span>
              </div>
            </div>
          </div>
          <div style={heroVisual}>
            <div style={heroCard}>
              <div style={heroCardInner}>
                <span style={heroCardLabel}>Rendimiento promedio</span>
                <span style={heroCardValue}>+18% <span style={{ fontSize: "1rem", color: "#6b7280" }}>anual</span></span>
                <div style={heroCardBar}>
                  <div style={{ ...heroCardFill, width: "72%" }} />
                </div>
                <span style={heroCardSub}>Proyectado en base a emprendimientos anteriores</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured developments ──────────────────── */}
      {featured.length > 0 && (
        <section style={featuredSection}>
          <div style={featuredInner}>
            <div style={featuredHeader}>
              <div>
                <h2 style={featuredTitle}>Emprendimientos destacados</h2>
                <p style={featuredSub}>Oportunidades seleccionadas en las mejores ubicaciones</p>
              </div>
            </div>
          </div>
          <FeaturedSlider
            developments={featured.map((d) => ({
              ...d,
              completion_date: d.completion_date ? new Date(d.completion_date).toISOString() : null,
            }))}
            lang={lang}
          />
        </section>
      )}

      {/* ─── How it works ───────────────────────────── */}
      <section style={howSection}>
        <div style={howInner}>
          <h2 style={howTitle}>¿Cómo funciona?</h2>
          <div style={howGrid}>
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
  background: "linear-gradient(135deg, #0f0f0f 0%, #1f1f1f 100%)",
  color: "#fff", padding: "5rem 1.5rem",
};
const heroInner: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto",
  display: "grid", gridTemplateColumns: "1fr auto",
  gap: "4rem", alignItems: "center",
};
const heroText: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.5rem" };
const heroBadge: React.CSSProperties = {
  display: "inline-block", width: "fit-content",
  background: "rgba(255,255,255,0.1)", borderRadius: 999,
  padding: "0.35rem 0.9rem", fontSize: "0.85rem", color: "#d1d5db",
};
const heroTitle: React.CSSProperties = {
  fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 900,
  lineHeight: 1.1, letterSpacing: "-0.04em", margin: 0,
};
const heroSubtitle: React.CSSProperties = {
  fontSize: "1.05rem", color: "#9ca3af", lineHeight: 1.6, maxWidth: 520, margin: 0,
};
const heroCta: React.CSSProperties = { display: "flex", gap: "0.75rem", flexWrap: "wrap" };
const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 1.75rem", background: "#fff", color: "#111",
  borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.95rem",
};
const btnOutline: React.CSSProperties = {
  padding: "0.75rem 1.75rem", background: "transparent", color: "#fff",
  border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 10,
  textDecoration: "none", fontWeight: 600, fontSize: "0.95rem",
};
const heroStats: React.CSSProperties = { display: "flex", gap: "0", alignItems: "center", flexWrap: "wrap" };
const heroStat: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.15rem", padding: "0 1.5rem 0 0" };
const heroStatNum: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" };
const heroStatLabel: React.CSSProperties = { fontSize: "0.75rem", color: "#6b7280" };
const heroStatDivider: React.CSSProperties = { width: 1, height: 36, background: "rgba(255,255,255,0.1)", margin: "0 1.5rem 0 0" };

/* Hero visual card */
const heroVisual: React.CSSProperties = { flexShrink: 0 };
const heroCard: React.CSSProperties = {
  width: 240, background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden",
};
const heroCardInner: React.CSSProperties = { padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" };
const heroCardLabel: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" };
const heroCardValue: React.CSSProperties = { fontSize: "2rem", fontWeight: 900, color: "#fff" };
const heroCardBar: React.CSSProperties = { height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 999, overflow: "hidden" };
const heroCardFill: React.CSSProperties = { height: "100%", background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: 999 };
const heroCardSub: React.CSSProperties = { fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.4 };

/* Featured */
const featuredSection: React.CSSProperties = { padding: "5rem 0", background: "#fff", overflow: "hidden" };
const featuredInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" };
const featuredHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" };
const featuredTitle: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 800, margin: "0 0 0.25rem", letterSpacing: "-0.03em" };
const featuredSub: React.CSSProperties = { color: "#6b7280", margin: 0, fontSize: "0.95rem" };

/* How it works */
const howSection: React.CSSProperties = { padding: "5rem 1.5rem", background: "#0f0f0f", color: "#fff" };
const howInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };
const howTitle: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 800, marginBottom: "2.5rem", letterSpacing: "-0.03em" };
const howGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" };
const howCard: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const howNum: React.CSSProperties = { fontSize: "2.5rem", fontWeight: 900, color: "rgba(255,255,255,0.1)", letterSpacing: "-0.05em" };
const howCardTitle: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 700, margin: 0 };
const howCardDesc: React.CSSProperties = { color: "#9ca3af", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 };
