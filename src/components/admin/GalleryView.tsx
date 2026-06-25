"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export type GalleryDevelopment = {
  id: number;
  name: string;
  images: string[];
};

type Props = { developments: GalleryDevelopment[]; lang: string };

export default function GalleryView({ developments, lang }: Props) {
  const [open, setOpen] = useState<{ devId: number; index: number } | null>(null);

  const openDev = open ? developments.find((d) => d.id === open.devId) : null;

  if (developments.length === 0) {
    return <p style={{ color: "#6b7280" }}>No hay fotos cargadas todavía.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {developments.map((d) => (
        <div key={d.id} style={section}>
          <div style={sectionHeader}>
            <h2 style={sectionTitle}>{d.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={sectionCount}>{d.images.length} foto{d.images.length !== 1 ? "s" : ""}</span>
              <Link href={`/${lang}/admin/developments/${d.id}/edit`} style={sectionLink}>
                Editar emprendimiento →
              </Link>
            </div>
          </div>

          {d.images.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Sin fotos cargadas.</p>
          ) : (
            <div style={grid}>
              {d.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  style={thumb}
                  onClick={() => setOpen({ devId: d.id, index: i })}
                >
                  <Image src={src} alt="" fill style={{ objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {open && openDev && openDev.images[open.index] && (
        <div style={overlay} onClick={() => setOpen(null)}>
          <div style={lightboxWrap} onClick={(e) => e.stopPropagation()}>
            <button style={closeBtn} onClick={() => setOpen(null)}>×</button>
            <div style={imageArea}>
              <Image src={openDev.images[open.index]} alt="" fill style={{ objectFit: "contain" }} priority />
            </div>
            {openDev.images.length > 1 && (
              <>
                <button
                  style={{ ...navBtn, left: 12 }}
                  onClick={() => setOpen({ devId: openDev.id, index: (open.index - 1 + openDev.images.length) % openDev.images.length })}
                >‹</button>
                <button
                  style={{ ...navBtn, right: 12 }}
                  onClick={() => setOpen({ devId: openDev.id, index: (open.index + 1) % openDev.images.length })}
                >›</button>
              </>
            )}
            <span style={counter}>{open.index + 1} / {openDev.images.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

const section: React.CSSProperties = { background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "1.25rem" };
const sectionHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" };
const sectionTitle: React.CSSProperties = { fontSize: "1.05rem", fontWeight: 700, margin: 0 };
const sectionCount: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };
const sectionLink: React.CSSProperties = { fontSize: "0.8rem", color: "#111", fontWeight: 600, textDecoration: "none" };

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.6rem" };
const thumb: React.CSSProperties = {
  position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden",
  border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", padding: 0,
};

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const lightboxWrap: React.CSSProperties = { position: "relative", width: "100%", height: "100%" };
const imageArea: React.CSSProperties = { position: "relative", width: "100%", height: "100%", margin: "3rem 4rem" };
const closeBtn: React.CSSProperties = {
  position: "absolute", top: 16, right: 20, zIndex: 10,
  background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
  width: 36, height: 36, borderRadius: "50%", fontSize: "1.4rem",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
const navBtn: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
  width: 44, height: 44, borderRadius: "50%", fontSize: "1.8rem",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
};
const counter: React.CSSProperties = {
  position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
  color: "rgba(255,255,255,0.6)", fontSize: "0.8rem",
};
