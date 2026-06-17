import { getSession } from "@/lib/session";
import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import PublicShell from "@/components/PublicShell";
import Image from "next/image";
import Link from "next/link";
import RemovalRequestButton from "@/components/RemovalRequestButton";

export default async function WalletPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
  const session = await getSession();

  if (!session) {
    redirect(`/${lang}/login`);
  }

  // Always show the current user's own investments
  const investments = await db`
    SELECT
      i.id, i.percentage, i.amount_usd, i.status, i.created_at, i.removal_requested_at,
      u.id AS unit_id, u.identifier, u.floor, u.total_m2,
      u.price_usd AS unit_price_usd, u.status AS unit_status, u.images AS unit_images,
      d.id AS development_id, d.name AS development_name, d.address AS development_address,
      d.images AS development_images
    FROM investments i
    JOIN units u ON u.id = i.unit_id
    JOIN developments d ON d.id = u.development_id
    WHERE i.user_id = ${Number(session.sub)}
    ORDER BY i.created_at DESC
  `;

  const totalInvested = investments
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + Number(i.amount_usd), 0);

  const activeCount = investments.filter((i) => i.status === "active").length;

  const fmtUsd = (n: number) =>
    `USD ${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const fmtDate = (d: unknown) =>
    new Date(d as string).toLocaleDateString(lang === "es" ? "es-AR" : "en-US", {
      day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
    });

  return (
    <PublicShell lang={lang}>
      <div style={page}>
        {/* Header */}
        <div style={pageHeader}>
          <div>
            <h1 style={pageTitle}>Mi cartera</h1>
            <p style={pageSub}>Bienvenido, {session.fullName}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={statsGrid}>
          <StatCard
            label="Total invertido"
            value={fmtUsd(totalInvested)}
            sub="en inversiones activas"
            accent
          />
          <StatCard
            label="Inversiones activas"
            value={String(activeCount)}
            sub="unidades en cartera"
          />
          <StatCard
            label="Promedio por inv."
            value={activeCount > 0 ? fmtUsd(totalInvested / activeCount) : "—"}
            sub="monto promedio"
          />
        </div>

        {/* Investments list */}
        {investments.length === 0 ? (
          <div style={empty}>
            <span style={{ fontSize: "3rem", opacity: 0.2 }}>💼</span>
            <p style={{ fontWeight: 600, margin: "0.5rem 0 0.25rem" }}>No tenés inversiones todavía</p>
            <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
              Explorá los emprendimientos disponibles y empezá a invertir.
            </p>
            <Link href={`/${lang}#catalogo`} style={btnExplore}>Ver emprendimientos</Link>
          </div>
        ) : (
          <div style={cards}>
            {investments.map((inv) => {
              const coverImg = inv.unit_images?.[0] ?? inv.development_images?.[0] ?? null;
              const statusColor = STATUS[inv.status] ?? STATUS.active;
              return (
                <div key={inv.id} style={card}>
                  {/* Cover */}
                  <div style={cardCover}>
                    {coverImg ? (
                      <Image src={coverImg} alt={inv.identifier} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={cardPlaceholder}><span style={{ fontSize: "1.5rem", opacity: 0.15 }}>🏠</span></div>
                    )}
                    <span style={{ ...statusBadge, background: statusColor.bg, color: statusColor.fg }}>
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={cardBody}>
                    <p style={devName}>{inv.development_name}</p>
                    <h3 style={unitId}>{inv.identifier}</h3>

                    {/* Stats row */}
                    <div style={metaRow}>
                      {inv.floor != null && <span style={metaChip}>Piso {inv.floor}</span>}
                      {inv.total_m2 != null && <span style={metaChip}>{inv.total_m2} m²</span>}
                    </div>

                    {/* Percentage bar */}
                    <div style={pctSection}>
                      <div style={pctBarRow}>
                        <span style={pctText}>{Number(inv.percentage)}% de participación</span>
                        <span style={pctAmount}>{fmtUsd(Number(inv.amount_usd))}</span>
                      </div>
                      <div style={pctBar}>
                        <div style={{ ...pctFill, width: `${Number(inv.percentage)}%` }} />
                      </div>
                      <p style={unitTotal}>Valor total UF: {fmtUsd(Number(inv.unit_price_usd))}</p>
                    </div>

                    <div style={cardFooter}>
                      <span style={dateLabel}>{fmtDate(inv.created_at)}</span>
                      <Link
                        href={`/${lang}/emprendimientos/${inv.development_id}`}
                        style={viewLink}
                      >
                        Ver emprendimiento →
                      </Link>
                    </div>

                    {inv.status === "active" && session.role === "investor" && (
                      <RemovalRequestButton
                        investmentId={inv.id}
                        hasPendingRequest={!!inv.removal_requested_at}
                      />
                    )}
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

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div style={{ ...statCard, ...(accent ? statCardAccent : {}) }}>
      <p style={{ fontSize: "0.75rem", fontWeight: 600, color: accent ? "rgba(255,255,255,0.7)" : "#9ca3af", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ fontSize: "1.75rem", fontWeight: 900, color: accent ? "#fff" : "#111", margin: "0.25rem 0 0", letterSpacing: "-0.04em" }}>{value}</p>
      <p style={{ fontSize: "0.78rem", color: accent ? "rgba(255,255,255,0.6)" : "#9ca3af", margin: "0.1rem 0 0" }}>{sub}</p>
    </div>
  );
}

const STATUS: Record<string, { bg: string; fg: string }> = {
  active:    { bg: "#dcfce7", fg: "#166534" },
  pending:   { bg: "#fef9c3", fg: "#854d0e" },
  cancelled: { bg: "#fee2e2", fg: "#991b1b" },
};
const STATUS_LABELS: Record<string, string> = {
  active: "Activa", pending: "Pendiente", cancelled: "Cancelada",
};

/* Styles */
const page: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" };
const pageHeader: React.CSSProperties = { marginBottom: "2rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.75rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em" };
const pageSub: React.CSSProperties = { color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.95rem" };

const statsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" };
const statCard: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.25rem 1.5rem" };
const statCardAccent: React.CSSProperties = { background: "#111", border: "1px solid #111" };

const empty: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", gap: "0.5rem" };
const btnExplore: React.CSSProperties = { marginTop: "0.75rem", padding: "0.6rem 1.5rem", background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" };

const cards: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };
const cardCover: React.CSSProperties = { position: "relative", height: 140, background: "#f3f4f6" };
const cardPlaceholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f9fafb,#e5e7eb)" };
const statusBadge: React.CSSProperties = { position: "absolute", top: 10, right: 10, padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.72rem", fontWeight: 700 };
const cardBody: React.CSSProperties = { padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.5rem" };
const devName: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", margin: 0, fontWeight: 600 };
const unitId: React.CSSProperties = { fontSize: "1rem", fontWeight: 800, margin: 0, color: "#111" };
const metaRow: React.CSSProperties = { display: "flex", gap: "0.3rem", flexWrap: "wrap" };
const metaChip: React.CSSProperties = { fontSize: "0.72rem", padding: "0.15rem 0.45rem", background: "#f3f4f6", borderRadius: 999, color: "#374151" };

const pctSection: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.25rem" };
const pctBarRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline" };
const pctText: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 700, color: "#374151" };
const pctAmount: React.CSSProperties = { fontSize: "1rem", fontWeight: 900, color: "#111" };
const pctBar: React.CSSProperties = { height: 6, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" };
const pctFill: React.CSSProperties = { height: "100%", background: "linear-gradient(90deg, #4ade80, #22c55e)", borderRadius: 999 };
const unitTotal: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af", margin: 0 };

const cardFooter: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem", paddingTop: "0.75rem", borderTop: "1px solid #f3f4f6" };
const dateLabel: React.CSSProperties = { fontSize: "0.72rem", color: "#9ca3af" };
const viewLink: React.CSSProperties = { fontSize: "0.78rem", color: "#111", fontWeight: 600, textDecoration: "none" };

