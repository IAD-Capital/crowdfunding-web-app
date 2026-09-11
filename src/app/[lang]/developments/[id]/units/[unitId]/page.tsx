import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import db from "@/lib/db";
import { getAppUrl } from "@/lib/mail";
import PublicShell from "@/components/PublicShell";
import UnitHeroGallery from "@/components/UnitHeroGallery";
import RelatedUnits from "@/components/RelatedUnits";
import ImageGallery from "@/components/admin/ImageGallery";
import BuyPanel from "@/components/BuyPanel";
import TrackedLink from "@/components/TrackedLink";
import ContactForm from "@/components/ContactForm";
import Image from "next/image";
import { unitPriceStageLabel } from "@/lib/unitPriceStages";
import {
  Layers, Maximize, Home, Trees, BedDouble, Bed, Bath, Compass, ChevronRight, MapPin,
  Waves, Dumbbell, PartyPopper, ShieldCheck, Flame, SquareParking, WashingMachine,
  Laptop, Sparkles, Baby, Sun, Wifi, Utensils, ConciergeBell, CheckCircle2, Scale,
  TrendingUp, TrendingDown, History,
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
    ? await db`SELECT id, name, address, neighborhood, city, country, images, plan_images, interior_images, amenities, visible, slug FROM developments WHERE id = ${idParam}`
    : await db`SELECT id, name, address, neighborhood, city, country, images, plan_images, interior_images, amenities, visible, slug FROM developments WHERE slug = ${idParam}`;
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

  const [phoneRow] = isAuthenticated
    ? await db<{ phone: string | null }[]>`SELECT phone FROM users WHERE id = ${Number(session!.sub)}`
    : [null];
  const hasPhone = !!phoneRow?.phone?.trim();
  const userPhone = phoneRow?.phone?.trim() || "";

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

  // Price history — only shown when the admin has actually loaded entries for this unit
  const priceHistory = await db<
    { id: number; effective_date: string; stage: string; total_value_usd: number; value_per_m2_usd: number | null }[]
  >`
    SELECT id, effective_date, stage, total_value_usd, value_per_m2_usd
    FROM unit_price_history
    WHERE unit_id = ${unit.id}
    ORDER BY effective_date ASC, id ASC
  `;

  // Today's price is always a valid data point — one loaded historic entry is enough to
  // show a comparison, since "now" (current_price_usd, falling back to price_usd) closes the timeline.
  const currentTotalValue = unit.current_price_usd != null
    ? Number(unit.current_price_usd)
    : unit.price_usd != null
    ? Number(unit.price_usd)
    : null;
  const currentValuePerM2 = currentTotalValue != null && unit.total_m2 != null
    ? currentTotalValue / Number(unit.total_m2)
    : null;
  const priceHistoryTimeline = [
    ...priceHistory.map((e) => ({ ...e, isToday: false as const })),
    ...(priceHistory.length > 0 && currentTotalValue != null
      ? [{
          id: -1,
          effective_date: new Date().toISOString(),
          stage: "",
          total_value_usd: currentTotalValue,
          value_per_m2_usd: currentValuePerM2,
          isToday: true as const,
        }]
      : []),
  ];

  // Related properties — same development first, then other available units, so there's always a full row/carousel to keep browsing
  const sameDevRelated = await db<{
    id: number; identifier: string; price_usd: number | null;
    total_m2: number | null; rooms: number | null; images: string[]; status: string;
  }[]>`
    SELECT id, identifier, price_usd, total_m2, rooms, images, status
    FROM units
    WHERE development_id = ${dev.id} AND id != ${unit.id} AND status != 'sold'
    ORDER BY id ASC
    LIMIT 8
  `;
  const otherDevRelated = await db<{
    id: number; identifier: string; price_usd: number | null;
    total_m2: number | null; rooms: number | null; images: string[]; status: string;
    dev_address: string; dev_slug: string | null; dev_id: number; dev_amenities: string[];
  }[]>`
    SELECT u.id, u.identifier, u.price_usd, u.total_m2, u.rooms, u.images, u.status,
           d.address AS dev_address, d.slug AS dev_slug, d.id AS dev_id, d.amenities AS dev_amenities
    FROM units u
    JOIN developments d ON d.id = u.development_id
    WHERE u.development_id != ${dev.id} AND u.status != 'sold' AND d.visible = true
    ORDER BY u.id DESC
    LIMIT ${Math.max(0, 8 - sameDevRelated.length)}
  `;
  const relatedUnits = [
    ...sameDevRelated.map((u) => ({
      ...u,
      dev_address: dev.address as string,
      dev_slug: (dev.slug ?? dev.id) as string | number,
      dev_amenities: (dev.amenities ?? []) as string[],
    })),
    ...otherDevRelated.map((u) => ({
      ...u,
      dev_slug: (u.dev_slug ?? u.dev_id) as string | number,
      dev_amenities: (u.dev_amenities ?? []) as string[],
    })),
  ];

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

  const fullAddress = [dev.address, dev.neighborhood, dev.city, dev.country].filter(Boolean).join(", ");
  const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

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
          .contact-form-row { grid-template-columns: 1fr !important; }
        }
      `,
        }}
      />
      <UnitHeroGallery
        images={galleryImages}
        alt={unit.identifier}
        backHref={`/${lang}/developments/${dev.slug ?? dev.id}`}
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
              <div style={priceCol}>
                {unit.status === "sold" && (
                  <span style={{ ...statusPillInline, background: sc.bg, color: sc.fg }}>{sc.label}</span>
                )}
                {showInvestHeadline ? (
                  <>
                    <p style={unitValueLine}>
                      Valor de la unidad: USD {Number(unit.price_usd).toLocaleString("es-AR")}
                    </p>
                    <p style={bigPrice}>
                      Invertí desde{" "}
                      <span style={bigPriceHighlight}>
                        USD {minInvestUsd!.toLocaleString("es-AR")}
                        <span style={bigPricePct}>(5%)</span>
                      </span>
                    </p>
                  </>
                ) : (
                  <p style={bigPrice}>
                    {unit.price_usd != null
                      ? `USD ${Number(unit.price_usd).toLocaleString("es-AR")}`
                      : "Consultar"}
                  </p>
                )}
                <p style={addressLine}>{dev.address} · Unidad {unit.identifier}</p>
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

            {/* Price history — filled in per unit from the admin, hidden until at least one entry exists */}
            {priceHistory.length > 0 && (
              <div>
                <h2 style={sectionTitle}>
                  <span style={legalTitleRow}>
                    <History size={18} />
                    Historial de precios
                  </span>
                </h2>
                <div style={priceHistoryList}>
                  {priceHistoryTimeline.map((entry, i) => {
                    const prev = priceHistoryTimeline[i - 1];
                    const pct = prev
                      ? ((Number(entry.total_value_usd) - Number(prev.total_value_usd)) / Number(prev.total_value_usd)) * 100
                      : null;
                    const isCurrent = entry.isToday;
                    const isLast = i === priceHistoryTimeline.length - 1;
                    const dotColor = pct == null ? "#1b4de0" : pct >= 0 ? "#22c55e" : "#ef4444";
                    return (
                      <div key={entry.id} style={priceHistoryItem}>
                        <div style={priceHistoryMarkerCol}>
                          <div style={priceHistoryDot(dotColor)} />
                          {!isLast && <div style={priceHistoryLine} />}
                        </div>
                        <div style={priceHistoryCard(isCurrent)}>
                          <div style={priceHistoryCardTop}>
                            <p style={priceHistoryDate}>{isCurrent ? "Hoy" : fmtDate(new Date(entry.effective_date))}</p>
                            <div style={priceHistoryBadgeGroup}>
                              {entry.stage && <span style={priceHistoryStagePill}>{unitPriceStageLabel(entry.stage)}</span>}
                              {isCurrent && (
                                <span style={priceHistoryCurrentPill}>
                                  <Sparkles size={11} />
                                  Actual
                                </span>
                              )}
                            </div>
                          </div>
                          <div style={priceHistoryValueRow}>
                            <p style={priceHistoryValue}>
                              USD {Number(entry.total_value_usd).toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                            </p>
                            {pct != null && (
                              <span style={{ ...priceHistoryPctPill, ...(pct >= 0 ? priceHistoryPctUp : priceHistoryPctDown) }}>
                                {pct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                                {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          {entry.value_per_m2_usd != null && (
                            <p style={priceHistoryM2}>
                              USD {Number(entry.value_per_m2_usd).toLocaleString("es-AR", { maximumFractionDigits: 0 })} /m²
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legal aspects post-investment — filled in per unit from the admin, hidden until set */}
            {unit.legal_terms && (
              <div>
                <h2 style={sectionTitle}>
                  <span style={legalTitleRow}>
                    <Scale size={18} />
                    Aspectos legales
                  </span>
                </h2>
                <div style={legalBox}>
                  <p style={legalText}>{unit.legal_terms}</p>
                </div>
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

            {/* Location — built from the development's address, no lat/lng stored so this uses Google's query-based embed */}
            {dev.address && (
              <div>
                <h2 style={sectionTitle}>Ubicación</h2>
                <div style={mapWrap}>
                  <iframe
                    src={mapEmbedSrc}
                    style={mapIframe}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Mapa de ${fullAddress}`}
                  />
                </div>
                <div style={mapFooter}>
                  <span style={mapAddress}>
                    <MapPin size={14} />
                    {fullAddress}
                  </span>
                  <TrackedLink
                    href={mapSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={mapLink}
                    ctaId="unit_page_open_maps"
                    ctaLabel={unit.identifier}
                    ctaLocation="unit_page_location"
                  >
                    Ver en Google Maps →
                  </TrackedLink>
                </div>
              </div>
            )}

            {/* Solicitar más información de la unidad */}
            <div>
              <h2 style={sectionTitle}>¿Querés más información sobre esta unidad?</h2>
              <div style={legalBox}>
                <ContactForm
                  unitContext={{
                    label: `${dev.address} (Unidad ${unit.identifier})`,
                    url: `${getAppUrl()}${unitPath}`,
                  }}
                  initialFullName={session?.fullName ?? ""}
                  initialEmail={session?.email ?? ""}
                  initialPhone={userPhone}
                />
              </div>
            </div>

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
                    <span style={sideFromPct}>(5%)</span>
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

              {!isAuthenticated && (
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
                  <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 900 }}>
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
                  <TrackedLink
                    href={`/${lang}/como-invertir`}
                    style={sideBtnSecondary}
                    ctaId="unit_page_how_it_works"
                    ctaLabel={unit.identifier}
                    ctaLocation="unit_page_sidebar"
                  >
                    ¿Cómo funciona?
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

      <RelatedUnits units={relatedUnits} lang={lang} />
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

const body: React.CSSProperties = { background: "#f9fafb", padding: "2rem 1.5rem 3rem" };
const bodyInner: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: "2.5rem", alignItems: "start" };
const leftCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "2rem", minWidth: 0 };

const imagesDisclaimerWrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "0.75rem 1.5rem 0" };
const imagesDisclaimer: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", margin: 0, fontStyle: "italic" };

/* Top info block */
const topInfoBlock: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const priceCol: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const statusPillInline: React.CSSProperties = { display: "inline-block", width: "fit-content", borderRadius: 999, padding: "0.2rem 0.75rem", fontSize: "0.75rem", fontWeight: 700 };
const bigPrice: React.CSSProperties = { fontSize: "2.25rem", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.04em" };
const unitValueLine: React.CSSProperties = { color: "#6b7280", fontSize: "0.95rem", fontWeight: 600, margin: 0 };
const bigPriceHighlight: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", fontFamily: "var(--font-display)",
  background: "rgba(27,77,224,0.08)", border: "1px solid rgba(27,77,224,0.16)",
  borderRadius: "0.22em", padding: "0 0.22em", color: "#1b4de0",
};
const bigPricePct: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 700, color: "#6b7280", marginLeft: "0.4rem" };
const addressLine: React.CSSProperties = { color: "#6b7280", fontSize: "0.9rem", margin: 0 };
const estCta: React.CSSProperties = { color: "#1b4de0", fontWeight: 700, textDecoration: "none", fontSize: "0.85rem", width: "fit-content" };

/* Facts grid */
const infoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem" };
const factCell: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.65rem", background: "#f3f4f6", borderRadius: 10, padding: "0.85rem 1rem" };
const factIcon: React.CSSProperties = { color: "#4b5563", flexShrink: 0, display: "flex" };
const factText: React.CSSProperties = { fontSize: "0.88rem", color: "#111", fontWeight: 600 };

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

/* Location map */
const mapWrap: React.CSSProperties = { position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 14, overflow: "hidden", border: "1px solid #e5e7eb", background: "#f3f4f6" };
const mapIframe: React.CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 };
const mapFooter: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" };
const mapAddress: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "#6b7280" };
const mapLink: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 700, color: "#1b4de0", textDecoration: "none", whiteSpace: "nowrap" };

/* Legal aspects */
const legalTitleRow: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.5rem" };
const legalBox: React.CSSProperties = { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.1rem 1.25rem" };
const legalText: React.CSSProperties = { color: "#374151", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" };

/* Price history — vertical timeline of cards, no horizontal scroll at any width */
const priceHistoryList: React.CSSProperties = { display: "flex", flexDirection: "column" };
const priceHistoryItem: React.CSSProperties = { display: "flex", gap: "0.9rem", alignItems: "stretch" };
const priceHistoryMarkerCol: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", width: 12, flexShrink: 0 };
const priceHistoryDot = (color: string): React.CSSProperties => ({
  width: 12, height: 12, borderRadius: 999, background: color, marginTop: "0.4rem", flexShrink: 0,
  boxShadow: `0 0 0 4px ${color}22`,
});
const priceHistoryLine: React.CSSProperties = { width: 2, flex: 1, minHeight: 24, background: "#e5e7eb", marginTop: "0.25rem" };
const priceHistoryCard = (highlight: boolean): React.CSSProperties => ({
  flex: 1, minWidth: 0, marginBottom: "0.9rem",
  background: highlight ? "rgba(27,77,224,0.05)" : "#fff",
  border: `1px solid ${highlight ? "rgba(27,77,224,0.28)" : "#e5e7eb"}`,
  borderRadius: 14, padding: "0.9rem 1.1rem",
  boxShadow: highlight ? "0 4px 16px rgba(27,77,224,0.1)" : "0 1px 2px rgba(17,17,17,0.03)",
  display: "flex", flexDirection: "column", gap: "0.45rem",
});
const priceHistoryCardTop: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" };
const priceHistoryDate: React.CSSProperties = { fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600, margin: 0 };
const priceHistoryBadgeGroup: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.4rem" };
const priceHistoryStagePill: React.CSSProperties = { display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, background: "#eff3ff", color: "#1b4de0" };
const priceHistoryCurrentPill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.68rem", fontWeight: 700,
  color: "#fff", background: "linear-gradient(90deg, #1b4de0, #3b6bff)", borderRadius: 999,
  padding: "0.2rem 0.55rem", textTransform: "uppercase", letterSpacing: "0.03em",
};
const priceHistoryValueRow: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.6rem", flexWrap: "wrap" };
const priceHistoryValue: React.CSSProperties = { fontSize: "1.4rem", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.02em" };
const priceHistoryM2: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280", margin: 0, fontWeight: 600 };
const priceHistoryPctPill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.78rem", fontWeight: 700, padding: "0.1rem 0.5rem", borderRadius: 999 };
const priceHistoryPctUp: React.CSSProperties = { background: "#dcfce7", color: "#166534" };
const priceHistoryPctDown: React.CSSProperties = { background: "#fee2e2", color: "#991b1b" };

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

const sidebar: React.CSSProperties = { position: "sticky", top: 80, marginTop: "1.5rem", minWidth: 0 };
const sideCard: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" };
const sidePriceLabel: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
const sidePrice: React.CSSProperties = { fontSize: "2rem", fontWeight: 900, color: "#111", margin: 0, letterSpacing: "-0.04em" };
const sideFromPct: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 700, color: "#6b7280", letterSpacing: "normal", marginLeft: "0.4rem" };
const sideUnitValueNote: React.CSSProperties = { fontSize: "0.8rem", color: "#9ca3af", margin: 0 };
const availableNote: React.CSSProperties = { fontSize: "0.78rem", color: "#d97706", fontWeight: 600, margin: 0, background: "#fffbeb", borderRadius: 8, padding: "0.4rem 0.75rem" };
const noPaymentNote: React.CSSProperties = { fontSize: "0.78rem", color: "#1e40af", margin: 0, background: "#eff6ff", borderRadius: 8, padding: "0.5rem 0.75rem", lineHeight: 1.4 };
const soldNote: React.CSSProperties = { fontSize: "0.85rem", color: "#991b1b", background: "#fee2e2", borderRadius: 8, padding: "0.75rem", textAlign: "center", margin: 0 };
const sideDivider: React.CSSProperties = { height: 1, background: "#e5e7eb" };
const sideBtnPrimary: React.CSSProperties = { display: "block", textAlign: "center", padding: "0.85rem", background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.95rem" };
const sideBtnSecondary: React.CSSProperties = { display: "block", width: "100%", textAlign: "center", padding: "0.75rem", background: "#fff", color: "#111", border: "1.5px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" };
const loginHint: React.CSSProperties = { fontSize: "0.82rem", color: "#6b7280", textAlign: "center", margin: 0 };
const loginHintLink: React.CSSProperties = { color: "#111", fontWeight: 700, textDecoration: "underline" };
const alreadyInvested: React.CSSProperties = { background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem", textAlign: "center" };
const walletBtn: React.CSSProperties = { marginTop: "0.5rem", padding: "0.45rem 1rem", background: "#111", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: "0.82rem" };
