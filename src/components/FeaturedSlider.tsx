"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type Development = {
  id: number;
  name: string;
  address: string;
  status: string;
  completion_date?: string | null;
  amenities: string[];
  images: string[];
  unit_count: number;
};

type Props = {
  developments: Development[];
  lang: string;
};

export default function FeaturedSlider({ developments, lang }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - 24, behavior: "smooth" });
    setActive(index);
  }, []);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const scrollLeft = track.scrollLeft;
    let closest = 0;
    let minDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft - 24 - scrollLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActive(closest);
  }, []);

  return (
    <div>
      {/* Track */}
      <div ref={trackRef} style={track} onScroll={onScroll}>
        {developments.map((d) => (
          <FeatCard key={d.id} d={d} lang={lang} />
        ))}
      </div>

      {/* Dots — only visible on mobile via CSS */}
      {developments.length > 1 && (
        <div style={dots} className="feat-dots">
          {developments.map((_, i) => (
            <button
              key={i}
              style={dot(i === active)}
              onClick={() => scrollTo(i)}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .feat-track {
            display: flex !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 1rem;
            padding-bottom: 0.5rem;
            max-width: none !important;
          }
          .feat-track::-webkit-scrollbar { display: none; }
          .feat-card {
            flex: 0 0 82% !important;
            scroll-snap-align: start;
          }
          .feat-dots { display: flex !important; }
        }
        @media (min-width: 769px) {
          .feat-dots { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function FeatCard({ d, lang }: { d: Development; lang: string }) {
  const fmtDate = d.completion_date
    ? new Date(d.completion_date).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })
    : null;

  return (
    <Link href={`/${lang}/emprendimientos/${d.id}`} style={card} className="feat-card">
      <div style={cover}>
        {d.images?.[0] ? (
          <Image src={d.images[0]} alt={d.name} fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={placeholder}><span style={{ fontSize: "3rem", opacity: 0.12 }}>🏢</span></div>
        )}
        <div style={gradient} />
        <div style={overlay}>
          <h3 style={cardName}>{d.name}</h3>
          <p style={cardAddr}>{d.address}</p>
        </div>
        <span style={photoBadge}>
          🏠 {d.unit_count} unidades{fmtDate ? ` · ${fmtDate}` : ""}
        </span>
      </div>
      {d.amenities?.length > 0 && (
        <div style={amenRow}>
          {d.amenities.slice(0, 4).map((a) => (
            <span key={a} style={amenChip}>{a}</span>
          ))}
          {d.amenities.length > 4 && (
            <span style={{ ...amenChip, color: "#9ca3af" }}>+{d.amenities.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  );
}

const track: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "1.25rem",
  maxWidth: 1200,
  margin: "0 auto",
  padding: "0 1.5rem",
};
const dots: React.CSSProperties = {
  display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "1.25rem",
};
const dot = (active: boolean): React.CSSProperties => ({
  width: active ? 20 : 8, height: 8, borderRadius: 999,
  background: active ? "#111" : "#d1d5db",
  border: "none", cursor: "pointer", padding: 0,
  transition: "all 0.25s",
});

const card: React.CSSProperties = {
  borderRadius: 14, overflow: "hidden", textDecoration: "none", color: "inherit",
  border: "1px solid #e5e7eb", display: "flex", flexDirection: "column",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};
const cover: React.CSSProperties = { position: "relative", height: 240, background: "#f3f4f6", flexShrink: 0 };
const placeholder: React.CSSProperties = { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#f9fafb,#e5e7eb)" };
const gradient: React.CSSProperties = { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)" };
const overlay: React.CSSProperties = { position: "absolute", bottom: 44, left: 16, right: 16 };
const cardName: React.CSSProperties = { color: "#fff", fontWeight: 800, fontSize: "1.15rem", margin: "0 0 0.2rem", textShadow: "0 1px 3px rgba(0,0,0,0.4)" };
const cardAddr: React.CSSProperties = { color: "rgba(255,255,255,0.72)", fontSize: "0.82rem", margin: 0 };
const photoBadge: React.CSSProperties = { position: "absolute", bottom: 10, left: 16, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: "0.72rem", padding: "0.2rem 0.6rem", borderRadius: 999 };
const amenRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.3rem", padding: "0.75rem 1rem" };
const amenChip: React.CSSProperties = { fontSize: "0.72rem", padding: "0.15rem 0.5rem", background: "#f3f4f6", color: "#374151", borderRadius: 999 };
