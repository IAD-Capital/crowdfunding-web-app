"use client";

import Link from "next/link";
import Image from "next/image";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

export type Developer = {
  id: number;
  name: string;
  website: string | null;
  logo: string | null;
  development_count: number;
};

type Props = { developers: Developer[]; lang: string };

export default function DevelopersView({ developers, lang }: Props) {
  return (
    <div>
      <div style={header}>
        <h1 style={pageTitle}>Desarrolladoras</h1>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link href={`/${lang}/admin/developers/import`} style={btnSecondary}>
            ⬆ Importar CSV
          </Link>
          <Link href={`/${lang}/admin/developers/new`} style={btnPrimary}>
            + Nueva desarrolladora
          </Link>
        </div>
      </div>

      {developers.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No hay desarrolladoras cargadas todavía.</p>
      ) : (
        <div style={grid}>
          {developers.map((d) => (
            <div key={d.id} style={card}>
              <div style={cardTop}>
                <div style={logoWrap}>
                  {d.logo ? (
                    <Image src={d.logo} alt={d.name} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={logoPlaceholder} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={cardName}>{d.name}</h2>
                  {d.website && (
                    <a href={d.website} target="_blank" rel="noopener noreferrer" style={cardWebsite}>
                      {d.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>

              <p style={cardStat}>
                {d.development_count} emprendimiento{d.development_count !== 1 ? "s" : ""} asociado{d.development_count !== 1 ? "s" : ""}
              </p>

              <div style={cardActions}>
                <Link href={`/${lang}/admin/developers/${d.id}/edit`} style={actionLink}>Editar</Link>
                <DeleteWithConfirmButton
                  deleteUrl={`/api/admin/developers/${d.id}`}
                  confirmText={d.name}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const header: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" };
const pageTitle: React.CSSProperties = { fontSize: "1.5rem", fontWeight: 700 };
const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#111", color: "#fff",
  borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1rem", background: "#fff", color: "#374151",
  border: "1px solid #d1d5db", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem",
};

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: "1.25rem" };
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, padding: "1.25rem",
  border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  display: "flex", flexDirection: "column", gap: "0.75rem",
};
const cardTop: React.CSSProperties = { display: "flex", gap: "0.85rem", alignItems: "center" };
const logoWrap: React.CSSProperties = {
  position: "relative", width: 56, height: 56, borderRadius: 10, overflow: "hidden",
  background: "#f3f4f6", flexShrink: 0,
};
const logoPlaceholder: React.CSSProperties = {
  width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
  background: "linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%)",
};
const cardName: React.CSSProperties = { fontSize: "1rem", fontWeight: 700, margin: 0 };
const cardWebsite: React.CSSProperties = { fontSize: "0.78rem", color: "#6b7280", textDecoration: "none", display: "block", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const cardStat: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280", margin: 0 };
const cardActions: React.CSSProperties = { display: "flex", gap: "0.5rem" };
const actionLink: React.CSSProperties = {
  padding: "0.4rem 0.9rem", background: "#fff", color: "#111",
  borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: "0.8rem",
  border: "1px solid #d1d5db",
};
