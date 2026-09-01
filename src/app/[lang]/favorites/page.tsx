import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import PublicShell from "@/components/PublicShell";
import Image from "next/image";
import TrackedLink from "@/components/TrackedLink";
import FavoriteButton from "@/components/FavoriteButton";
import { Maximize, BedDouble } from "lucide-react";

type FavoriteRow = {
  favorite_id: number;
  unit_id: number;
  identifier: string;
  floor: number | null;
  total_m2: number | null;
  rooms: number | null;
  price_usd: number | string;
  status: string;
  images: string[] | null;
  development_id: number;
  development_name: string;
  development_slug: string | null;
  development_address: string;
};

export default async function FavoritesPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();

  if (!session) {
    redirect(`/${lang}/login?next=${encodeURIComponent(`/${lang}/favorites`)}`);
  }

  const favorites = await db<FavoriteRow[]>`
    SELECT
      f.id AS favorite_id,
      u.id AS unit_id, u.identifier, u.floor, u.total_m2, u.rooms, u.price_usd, u.status, u.images,
      d.id AS development_id, d.name AS development_name, d.slug AS development_slug, d.address AS development_address
    FROM favorites f
    JOIN units u ON u.id = f.unit_id
    JOIN developments d ON d.id = u.development_id
    WHERE f.user_id = ${Number(session.sub)}
    ORDER BY f.created_at DESC
  `;

  const STATUS_UNIT: Record<string, { bg: string; fg: string; label: string }> = {
    available: { bg: "#dcfce7", fg: "#166534", label: "Disponible" },
    partial:   { bg: "#fef9c3", fg: "#854d0e", label: "Parcial" },
    sold:      { bg: "#fee2e2", fg: "#991b1b", label: "Vendida" },
  };

  const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

  return (
    <PublicShell lang={lang}>
      <div style={page}>
        <div style={pageHeader}>
          <div>
            <h1 style={pageTitle}>Mis favoritos</h1>
            <p style={pageSub}>
              {favorites.length} unidad{favorites.length !== 1 ? "es" : ""} guardada{favorites.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div style={empty}>
            <p style={{ fontWeight: 600, margin: "0.5rem 0 0.25rem" }}>Todavía no guardaste ninguna unidad</p>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
              Explorá el catálogo y tocá el corazón en la unidad que te interese para guardarla acá.
            </p>
            <TrackedLink
              href={`/${lang}#catalog`}
              style={btnExplore}
              ctaId="favorites_explore_catalog"
              ctaLocation="favorites_empty_state"
            >
              Ver catálogo
            </TrackedLink>
          </div>
        ) : (
          <div style={cards}>
            {favorites.map((f) => {
              const sc = STATUS_UNIT[f.status] ?? { bg: "#f3f4f6", fg: "#374151", label: f.status };
              const coverImg = f.images?.[0] ?? null;
              return (
                <div key={f.favorite_id} style={card}>
                  <div style={cardCover}>
                    {coverImg ? (
                      <Image src={coverImg} alt={f.identifier} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={cardPlaceholder} />
                    )}
                    <span style={{ ...statusBadge, background: sc.bg, color: sc.fg }}>{sc.label}</span>
                    <FavoriteButton
                      unitId={f.unit_id}
                      initialFavorited
                      isAuthenticated
                      lang={lang}
                      label={f.identifier}
                      location="favorites_page"
                    />
                  </div>

                  <div style={cardBody}>
                    <p style={devName}>{f.development_name}</p>
                    <h3 style={unitId}>{f.identifier}</h3>

                    <div style={metaRow}>
                      {f.floor != null && <span style={metaChip}>Piso {f.floor}</span>}
                      {f.total_m2 != null && (
                        <span style={metaChip}><Maximize size={11} style={{ marginRight: 3, verticalAlign: -1 }} />{f.total_m2} m²</span>
                      )}
                      {f.rooms != null && (
                        <span style={metaChip}><BedDouble size={11} style={{ marginRight: 3, verticalAlign: -1 }} />{f.rooms} amb.</span>
                      )}
                    </div>

                    <p style={priceText}>
                      {f.price_usd != null ? fmtUsd(Number(f.price_usd)) : "Consultar precio"}
                    </p>

                    <div style={cardFooter}>
                      <span style={addrLabel}>{f.development_address}</span>
                      <TrackedLink
                        href={`/${lang}/developments/${f.development_slug ?? f.development_id}/units/${f.unit_id}`}
                        style={viewLink}
                        ctaId="favorites_view_unit"
                        ctaLabel={f.identifier}
                        ctaLocation="favorites_page"
                      >
                        Ver unidad →
                      </TrackedLink>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicShell>
  );
}

/* Styles — mirrors the wallet page's card layout */
const page: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" };
const pageHeader: React.CSSProperties = { marginBottom: "2rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em" };
const pageSub: React.CSSProperties = { color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.95rem" };

const empty: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", gap: "0.5rem" };
const btnExplore: React.CSSProperties = { marginTop: "0.75rem", padding: "0.6rem 1.5rem", background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" };

const cards: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };
const cardCover: React.CSSProperties = { position: "relative", height: 160, background: "#f3f4f6" };
const cardPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f9fafb,#e5e7eb)" };
const statusBadge: React.CSSProperties = { position: "absolute", top: 10, left: 10, padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700 };
const cardBody: React.CSSProperties = { padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem" };
const devName: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", margin: 0, fontWeight: 600 };
const unitId: React.CSSProperties = { fontSize: "1rem", fontWeight: 800, margin: 0, color: "#111" };
const metaRow: React.CSSProperties = { display: "flex", gap: "0.3rem", flexWrap: "wrap" };
const metaChip: React.CSSProperties = { fontSize: "0.72rem", padding: "0.15rem 0.45rem", background: "#f3f4f6", borderRadius: 999, color: "#374151", display: "inline-flex", alignItems: "center" };
const priceText: React.CSSProperties = { fontSize: "1.1rem", fontWeight: 900, color: "#111", margin: "0.1rem 0 0" };

const cardFooter: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem", paddingTop: "0.75rem", borderTop: "1px solid #f3f4f6" };
const addrLabel: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const viewLink: React.CSSProperties = { fontSize: "0.78rem", color: "#111", fontWeight: 600, textDecoration: "none", flexShrink: 0 };
