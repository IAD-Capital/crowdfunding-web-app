import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import db from "@/lib/db";
import { getAppUrl } from "@/lib/mail";
import PublicShell from "@/components/PublicShell";
import UnitHeroGallery from "@/components/UnitHeroGallery";
import ImageGallery from "@/components/admin/ImageGallery";
import BuyPanel from "@/components/BuyPanel";
import TrackedLink from "@/components/TrackedLink";
import Image from "next/image";
import {
  Layers, Maximize, Home, Trees, BedDouble, Bed, Bath, Compass, ChevronRight, MapPin,
  Waves, Dumbbell, PartyPopper, ShieldCheck, Flame, SquareParking, WashingMachine,
  Laptop, Sparkles, Baby, Sun, Wifi, Utensils, ConciergeBell, CheckCircle2,
} from "lucide-react";

const AMENITY_ICON_RULES: { keywords: string[]; icon: React.ReactNode }[] = [
  { keywords: ["piscina", "pileta"], icon: <Waves size={18} /> },
  { keywords: ["gimnasio", "gym"], icon: <Dumbbell size={18} /> },
  { keywords: ["sum", "eventos", "usos multiples"], icon: <PartyPopper size={18} /> },
  { keywords: ["seguridad", "vigilancia", "portero"], icon: <ShieldCheck size={18} /> },
  { keywords: ["parrilla", "quincho", "asador"], icon: <Flame size={18} /> },
  { keywords: ["cochera", "garage", "estacionamiento", "parking"], icon: <SquareParking size={18} /> },
  { keywords: ["lavadero", "laundry"], icon: <WashingMachine size={18} /> },
  { keywords: ["cowork", "oficina"], icon: <Laptop size={18} /> },
  { keywords: ["spa", "sauna"], icon: <Sparkles size={18} /> },
  { keywords: ["jardin", "parque", "verde"], icon: <Trees size={18} /> },
  { keywords: ["juegos", "niños", "kids"], icon: <Baby size={18} /> },
  { keywords: ["solarium", "terraza", "rooftop", "azotea"], icon: <Sun size={18} /> },
  { keywords: ["wifi", "internet"], icon: <Wifi size={18} /> },
  { keywords: ["restaurante", "resto", "gastronomico"], icon: <Utensils size={18} /> },
  { keywords: ["recepcion", "concierge", "lobby"], icon: <ConciergeBell size={18} /> },
];

function getAmenityIcon(name: string): React.ReactNode {
  const n = name.toLowerCase();
  const match = AMENITY_ICON_RULES.find((r) => r.keywords.some((k) => n.includes(k)));
  return match ? match.icon : <CheckCircle2 size={18} />;
}

// Shared by generateMetadata and the page component so the dev/unit lookup only runs once per request.
const getDevAndUnit = cache(async (idParam: string, unitIdParam: string, role: string | undefined) => {
  const isNumeric = /^\d+$/.test(idParam);
  const [dev] = isNumeric
    ? await db`SELECT id, name, address, neighborhood, city, images, plan_images, interior_images, amenities, visible, slug FROM developments WHERE id = ${idParam}`
    : await db`SELECT id, name, address, neighborhood, city, images, plan_images, interior_images, amenities, visible, slug FROM developments WHERE slug = ${idParam}`;
  if (!dev) return null;
  if (!dev.visible && role !== "superadmin") return null;

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
    WHERE u.id = ${unitIdParam} AND u.development_id = ${dev.id}
  `;
  if (!unit) return null;

  return { dev, unit };
});

export async function generateMetadata({
  params,
}: {
  params: { lang: string; id: string; unitId: string };
}): Promise<Metadata> {
  const session = await getSession();
  const data = await getDevAndUnit(params.id, params.unitId, session?.role);
  if (!data) return {};
  const { dev, unit } = data;
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  const title = `Unidad ${unit.identifier} - ${dev.address ?? dev.name} - IAD Capital`;
  const minInvestUsd = unit.price_usd != null ? Math.ceil(Number(unit.price_usd) * 0.05) : null;
  const description = minInvestUsd != null
    ? `Encontré esta propiedad en IAD Capital para invertir desde USD ${minInvestUsd.toLocaleString("es-AR")}. ${dev.address ?? dev.name}${unit.total_m2 != null ? ` · ${unit.total_m2} m²` : ""}${unit.rooms != null ? ` · ${unit.rooms} amb.` : ""}.`
    : `Encontré esta propiedad en IAD Capital. ${dev.address ?? dev.name}${unit.total_m2 != null ? ` · ${unit.total_m2} m²` : ""}.`;
  const image: string | undefined = unit.images?.[0] ?? dev.images?.[0];
  const url = `${getAppUrl()}/${lang}/developments/${dev.slug ?? dev.id}/units/${unit.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "IAD Capital",
      locale: lang === "es" ? "es_AR" : "en_US",
      type: "website",
      images: image ? [{ url: image, width: 1200, height: 800, alt: unit.identifier }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

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

  const data = await getDevAndUnit(params.id, params.unitId, session?.role);
  if (!data) notFound();
  const { dev, unit } = data;

  // Check if this investor already has a pending request or approved position in this unit
  const [myInvestment] = canInvest
    ? await db`
        SELECT id, status, percentage, amount_usd FROM investments
        WHERE unit_id = ${unit.id} AND user_id = ${Number(session!.sub)} AND status IN ('pending', 'approved')
      `
    : [null];

  const [phoneRow] = canInvest
    ? await db<{ phone: string | null }[]>`SELECT phone FROM users WHERE id = ${Number(session!.sub)}`
    : [null];
  const hasPhone = !!phoneRow?.phone?.trim();

  const [favoriteRow] = isAuthenticated
    ? await db`SELECT id FROM favorites WHERE user_id = ${Number(session!.sub)} AND unit_id = ${unit.id}`
    : [null];
  const isFavorited = !!favoriteRow;

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

  // Other units in the same development — same building, easy next step to invest
  const relatedUnits = await db`
    SELECT id, identifier, price_usd, total_m2, rooms, images, status
    FROM units
    WHERE development_id = ${dev.id} AND id != ${unit.id}
    ORDER BY (status = 'available') DESC, id ASC
    LIMIT 6
  `;

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

  const unitPath = `/${lang}/developments/${dev.slug ?? dev.id}/units/${unit.id}`;
  const minInvestUsd = unit.price_usd != null ? Math.ceil(Number(unit.price_usd) * 0.05) : null;
  const alreadyHasPosition = canInvest && !!myInvestment;
  const showInvestHeadline = minInvestUsd != null && !alreadyHasPosition && unit.status !== "sold" && !groupExpired;

  const galleryImages: string[] = unit.images?.length > 0 ? unit.images : (dev.images ?? []);

  return (
    <PublicShell lang={lang}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 900px) {
          .unit-body-inner { grid-template-columns: 1fr !important; }
          .unit-sidebar { position: static !important; }
        }
        @media (max-width: 640px) {
          .unit-hero-main { height: 300px !important; }
        }
      `,
        }}
      />
      <UnitHeroGallery
        images={galleryImages}
        alt={unit.identifier}
        backHref={`/${lang}/developments/${dev.slug ?? dev.id}`}
        backLabel={dev.name}
        shareUrl={`${getAppUrl()}${unitPath}`}
        shareTitle={
          (minInvestUsd != null
            ? `Encontré esta propiedad en IAD Capital para invertir desde USD ${minInvestUsd.toLocaleString("es-AR")}: `
            : "Encontré esta propiedad en IAD Capital: ") +
          `Unidad ${unit.identifier} - ${dev.address} - IAD Capital`
        }
        unitId={unit.id}
        initialFavorited={isFavorited}
        isAuthenticated={isAuthenticated}
        lang={lang}
      />

      <div style={imagesDisclaimerWrap}>
        <p style={imagesDisclaimer}>
          Las imágenes son ilustrativas y pueden no representar el estado real de la propiedad.
        </p>
      </div>

      {/* Body */}
      <div style={body}>
        <div style={bodyInner} className="unit-body-inner">
          {/* Left */}
          <div style={leftCol}>
            {/* Top info block */}
            <div style={topInfoBlock}>
              <div style={priceFactsRow}>
                <div style={priceCol}>
                  <span style={{ ...statusPillInline, background: sc.bg, color: sc.fg }}>{sc.label}</span>
                  <p style={bigPrice}>
                    {unit.price_usd != null
                      ? `USD ${Number(unit.price_usd).toLocaleString("es-AR")}`
                      : "Consultar"}
                  </p>
                  <p style={addressLine}>{dev.address} · Unidad {unit.identifier}</p>
                </div>

                <div style={quickFacts}>
                  {unit.rooms != null && (
                    <QuickFact value={unit.rooms} label={unit.rooms === 1 ? "ambiente" : "ambientes"} />
                  )}
                  {unit.bathrooms != null && (
                    <QuickFact value={unit.bathrooms} label={unit.bathrooms === 1 ? "baño" : "baños"} />
                  )}
                  {unit.total_m2 != null && <QuickFact value={Number(unit.total_m2)} label="m²" />}
                </div>
              </div>

              {showInvestHeadline && (
                <TrackedLink
                  href="#invertir"
                  style={estCta}
                  ctaId="unit_page_start_investing"
                  ctaLabel={unit.identifier}
                  ctaLocation="unit_page_header"
                >
                  Empezar a invertir →
                </TrackedLink>
              )}
            </div>

            {/* Facts grid */}
            <div style={infoGrid}>
              {unit.floor != null && <FactCell icon={<Layers size={18} />} text={`Piso ${unit.floor}`} />}
              {unit.total_m2 != null && <FactCell icon={<Maximize size={18} />} text={`${unit.total_m2} m² totales`} />}
              {unit.covered_m2 != null && <FactCell icon={<Home size={18} />} text={`${unit.covered_m2} m² cubiertos`} />}
              {unit.uncovered_m2 != null && <FactCell icon={<Trees size={18} />} text={`${unit.uncovered_m2} m² descubiertos`} />}
              {unit.rooms != null && (
                <FactCell icon={<BedDouble size={18} />} text={`${unit.rooms} ${unit.rooms === 1 ? "ambiente" : "ambientes"}`} />
              )}
              {unit.bedrooms != null && (
                <FactCell icon={<Bed size={18} />} text={`${unit.bedrooms} ${unit.bedrooms === 1 ? "dormitorio" : "dormitorios"}`} />
              )}
              {unit.bathrooms != null && (
                <FactCell icon={<Bath size={18} />} text={`${unit.bathrooms} ${unit.bathrooms === 1 ? "baño" : "baños"}`} />
              )}
              {unit.orientation && <FactCell icon={<Compass size={18} />} text={`Orientación ${unit.orientation}`} />}
            </div>

            {/* Amenities offered by the development — relevant to the invest decision */}
            {dev.amenities?.length > 0 && (
              <div>
                <h2 style={sectionTitle}>Amenities del emprendimiento</h2>
                <div style={infoGrid}>
                  {dev.amenities.map((a: string) => (
                    <FactCell key={a} icon={getAmenityIcon(a)} text={a} />
                  ))}
                </div>
              </div>
            )}

            {unit.description && (
              <div>
                <h2 style={sectionTitle}>Descripción</h2>
                <p style={descText}>{unit.description}</p>
              </div>
            )}

            {/* Unit's own floor plan — kept separate from the development's media below */}
            {unit.plan_images?.length > 0 && (
              <div>
                <h2 style={sectionTitle}>Plano de la unidad</h2>
                <ImageGallery images={unit.plan_images} />
              </div>
            )}

            {/* Development media, split by category so plans/interior/photos don't get mixed */}
            {dev.images?.length > 0 && (
              <div>
                <h2 style={sectionTitle}>Exterior</h2>
                <ImageGallery images={dev.images} />
              </div>
            )}

            {dev.plan_images?.length > 0 && (
              <div>
                <h2 style={sectionTitle}>Planos</h2>
                <ImageGallery images={dev.plan_images} />
              </div>
            )}

            {dev.interior_images?.length > 0 && (
              <div>
                <h2 style={sectionTitle}>Interior</h2>
                <ImageGallery images={dev.interior_images} />
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
                      {groupExpired ? "Grupo cerrado" : "Cierre del grupo"}
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

            {/* Related units — same building, easy next step */}
            {relatedUnits.length > 0 && (
              <div>
                <h2 style={sectionTitle}>Otras unidades disponibles</h2>
                <div style={relatedTrack}>
                  {relatedUnits.map((u) => {
                    const rsc = STATUS_UNIT[u.status] ?? { bg: "#f3f4f6", fg: "#374151", label: u.status };
                    return (
                      <TrackedLink
                        key={u.id}
                        href={`/${lang}/developments/${dev.slug ?? dev.id}/units/${u.id}`}
                        style={relatedCard}
                        ctaId="unit_page_related_unit"
                        ctaLabel={u.identifier}
                        ctaLocation="unit_page_related_units"
                      >
                        <div style={relatedImageWrap}>
                          {u.images?.[0] ? (
                            <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} sizes="220px" />
                          ) : (
                            <div style={relatedImagePlaceholder} />
                          )}
                          <span style={{ ...relatedStatusPill, background: rsc.bg, color: rsc.fg }}>{rsc.label}</span>
                        </div>
                        <div style={relatedInfo}>
                          <p style={relatedIdentifier}>Unidad {u.identifier}</p>
                          <p style={relatedPrice}>
                            {u.price_usd != null ? `USD ${Number(u.price_usd).toLocaleString("es-AR")}` : "Consultar"}
                          </p>
                          <div style={relatedStats}>
                            {u.total_m2 != null && (
                              <span style={relatedStat}><Maximize size={12} /> {Number(u.total_m2)} m²</span>
                            )}
                            {u.rooms != null && (
                              <span style={relatedStat}><BedDouble size={12} /> {u.rooms} amb.</span>
                            )}
                          </div>
                        </div>
                      </TrackedLink>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Compact development pointer — units stay the focus, this is just context */}
            <div style={devMiniCard}>
              {dev.images?.[0] && (
                <div style={devMiniImageWrap}>
                  <Image src={dev.images[0]} alt={dev.name} fill style={{ objectFit: "cover" }} sizes="56px" />
                </div>
              )}
              <div style={devMiniInfo}>
                <p style={devMiniLabel}>Parte del emprendimiento</p>
                <p style={devMiniName}>{dev.name}</p>
                <div style={devMiniAddressRow}>
                  <MapPin size={12} />
                  <span>{dev.neighborhood ? `${dev.neighborhood}, ` : ""}{dev.city ?? dev.address}</span>
                </div>
              </div>
              <TrackedLink
                href={`/${lang}/developments/${dev.slug ?? dev.id}`}
                style={devMiniLink}
                ctaId="unit_page_dev_mini_card"
                ctaLabel={dev.name}
                ctaLocation="unit_page"
              >
                Ver emprendimiento <ChevronRight size={14} />
              </TrackedLink>
            </div>
          </div>

          {/* Sidebar */}
          <aside style={sidebar} className="unit-sidebar">
            <div style={sideCard} id="invertir">
              {showInvestHeadline ? (
                <>
                  <p style={sidePriceLabel}>Invertí desde</p>
                  <p style={sidePrice}>
                    USD {minInvestUsd!.toLocaleString("es-AR")}
                    <span style={sideFromPct}> (5%)</span>
                  </p>
                  <p style={sideUnitValueNote}>
                    Valor total de la unidad: USD {Number(unit.price_usd).toLocaleString("es-AR")}
                  </p>
                </>
              ) : (
                <>
                  <p style={sidePriceLabel}>Precio</p>
                  <p style={sidePrice}>
                    {unit.price_usd != null
                      ? `USD ${Number(unit.price_usd).toLocaleString("es-AR")}`
                      : "Consultar"}
                  </p>
                </>
              )}

              {Number(unit.available_pct) < 100 && unit.status !== "sold" && (
                <p style={availableNote}>
                  {Number(unit.available_pct)}% disponible para invertir
                </p>
              )}

              {(!isAuthenticated || (canInvest && !myInvestment)) && (
                <p style={noPaymentNote}>
                  No se paga nada ahora. Tu solicitud sirve para coordinar una reunión y avanzar con la inversión.
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
                  <TrackedLink
                    href={`/${lang}/wallet`}
                    style={walletBtn}
                    ctaId="unit_page_view_wallet"
                    ctaLabel={unit.identifier}
                    ctaLocation="unit_page_sidebar"
                  >
                    Ver mi cartera →
                  </TrackedLink>
                </div>
              ) : canInvest && unit.status !== "sold" && unit.price_usd != null && !groupExpired ? (
                <BuyPanel
                  unitId={unit.id}
                  priceUsd={Number(unit.price_usd)}
                  identifier={unit.identifier}
                  lang={lang}
                  availablePct={Number(unit.available_pct)}
                  hasPhone={hasPhone}
                />
              ) : canInvest && groupExpired ? (
                <p style={soldNote}>El grupo de inversión para esta unidad ya está cerrado.</p>
              ) : unit.status === "sold" ? (
                <p style={soldNote}>Esta unidad ya fue vendida en su totalidad.</p>
              ) : !isAuthenticated ? (
                <>
                  <TrackedLink
                    href={`/${lang}/signup?next=${encodeURIComponent(unitPath)}`}
                    style={sideBtnPrimary}
                    ctaId="unit_page_signup"
                    ctaLabel={unit.identifier}
                    ctaLocation="unit_page_sidebar"
                  >
                    Invertir en esta unidad
                  </TrackedLink>
                  <p style={loginHint}>
                    ¿Ya tenés cuenta?{" "}
                    <TrackedLink
                      href={`/${lang}/login?next=${encodeURIComponent(unitPath)}`}
                      style={loginHintLink}
                      ctaId="unit_page_login"
                      ctaLabel={unit.identifier}
                      ctaLocation="unit_page_sidebar"
                    >
                      Iniciá sesión
                    </TrackedLink>
                  </p>
                </>
              ) : (
                // superadmin or other role: show info but no buy button
                <p style={{ fontSize: "0.82rem", color: "#6b7280", textAlign: "center", margin: 0 }}>
                  Solo los inversores pueden comprar participaciones.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}

function FactCell({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={factCell}>
      <span style={factIcon}>{icon}</span>
      <span style={factText}>{text}</span>
    </div>
  );
}

function QuickFact({ value, label }: { value: number; label: string }) {
  return (
    <div style={quickFactItem}>
      <span style={quickFactNum}>{value}</span>
      <span style={quickFactLabel}>{label}</span>
    </div>
  );
}

const body: React.CSSProperties = { background: "#f9fafb", padding: "2rem 1.5rem 3rem" };
const bodyInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "2.5rem", alignItems: "start" };
const leftCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "2rem" };

const imagesDisclaimerWrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0.75rem 1.5rem 0" };
const imagesDisclaimer: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", margin: 0, fontStyle: "italic" };

/* Top info block */
const topInfoBlock: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const priceFactsRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  flexWrap: "wrap", gap: "1rem",
};
const priceCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const statusPillInline: React.CSSProperties = { display: "inline-block", width: "fit-content", borderRadius: 999, padding: "0.2rem 0.75rem", fontSize: "0.75rem", fontWeight: 700 };
const bigPrice: React.CSSProperties = { fontSize: "2.25rem", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.04em" };
const addressLine: React.CSSProperties = { color: "#6b7280", fontSize: "0.9rem", margin: 0 };
const quickFacts: React.CSSProperties = { display: "flex", gap: "1.5rem", flexShrink: 0 };
const quickFactItem: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.1rem" };
const quickFactNum: React.CSSProperties = { fontSize: "1.4rem", fontWeight: 800, color: "#111" };
const quickFactLabel: React.CSSProperties = { fontSize: "0.78rem", color: "#6b7280" };
const estCta: React.CSSProperties = { color: "#1b4de0", fontWeight: 700, textDecoration: "none", fontSize: "0.85rem", width: "fit-content" };

/* Facts grid */
const infoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" };
const factCell: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.65rem", background: "#f3f4f6", borderRadius: 10, padding: "0.85rem 1rem" };
const factIcon: React.CSSProperties = { color: "#4b5563", flexShrink: 0, display: "flex" };
const factText: React.CSSProperties = { fontSize: "0.88rem", color: "#111", fontWeight: 600 };

/* Related units */
const relatedTrack: React.CSSProperties = { display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.25rem" };
const relatedCard: React.CSSProperties = { flex: "0 0 200px", textDecoration: "none", display: "flex", flexDirection: "column", gap: "0.5rem" };
const relatedImageWrap: React.CSSProperties = { position: "relative", width: "100%", aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", background: "#e5e7eb" };
const relatedImagePlaceholder: React.CSSProperties = { width: "100%", height: "100%", background: "#e5e7eb" };
const relatedStatusPill: React.CSSProperties = { position: "absolute", top: 10, left: 10, borderRadius: 999, padding: "0.15rem 0.6rem", fontSize: "0.68rem", fontWeight: 700 };
const relatedInfo: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.15rem" };
const relatedIdentifier: React.CSSProperties = { fontSize: "0.78rem", color: "#6b7280", margin: 0, fontWeight: 600 };
const relatedPrice: React.CSSProperties = { fontSize: "1rem", color: "#111", margin: 0, fontWeight: 800 };
const relatedStats: React.CSSProperties = { display: "flex", gap: "0.6rem", marginTop: "0.1rem" };
const relatedStat: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#6b7280", fontWeight: 600 };

/* Compact development pointer */
const devMiniCard: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.85rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "0.85rem 1rem", flexWrap: "wrap" };
const devMiniImageWrap: React.CSSProperties = { position: "relative", width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#e5e7eb" };
const devMiniInfo: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.1rem", flex: 1, minWidth: 160 };
const devMiniLabel: React.CSSProperties = { fontSize: "0.68rem", color: "#9ca3af", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" };
const devMiniName: React.CSSProperties = { fontSize: "0.92rem", color: "#111", margin: 0, fontWeight: 700 };
const devMiniAddressRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", color: "#6b7280" };
const devMiniLink: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.15rem", color: "#111", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none", flexShrink: 0 };

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
const sidePrice: React.CSSProperties = { fontSize: "2rem", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.04em" };
const sideFromPct: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 700, color: "#6b7280" };
const sideUnitValueNote: React.CSSProperties = { fontSize: "0.8rem", color: "#9ca3af", margin: 0 };
const availableNote: React.CSSProperties = { fontSize: "0.78rem", color: "#d97706", fontWeight: 600, margin: 0, background: "#fffbeb", borderRadius: 8, padding: "0.4rem 0.75rem" };
const noPaymentNote: React.CSSProperties = { fontSize: "0.78rem", color: "#1e40af", margin: 0, background: "#eff6ff", borderRadius: 8, padding: "0.5rem 0.75rem", lineHeight: 1.4 };
const soldNote: React.CSSProperties = { fontSize: "0.85rem", color: "#991b1b", background: "#fee2e2", borderRadius: 8, padding: "0.75rem", textAlign: "center", margin: 0 };
const sideDivider: React.CSSProperties = { height: 1, background: "#e5e7eb" };
const sideBtnPrimary: React.CSSProperties = { display: "block", textAlign: "center", padding: "0.85rem", background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.95rem" };
const loginHint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", textAlign: "center", margin: 0 };
const loginHintLink: React.CSSProperties = { color: "#111", fontWeight: 700, textDecoration: "underline" };
const alreadyInvested: React.CSSProperties = { background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem", textAlign: "center" };
const walletBtn: React.CSSProperties = { marginTop: "0.5rem", padding: "0.45rem 1rem", background: "#111", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" };
