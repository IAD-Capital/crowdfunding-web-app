"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import ShareButton from "./ShareButton";
import FavoriteButton from "./FavoriteButton";

type Props = {
  images: string[];
  alt: string;
  backHref: string;
  backLabel: string;
  shareUrl: string;
  shareTitle: string;
  unitId: number;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  lang: string;
};

export default function UnitHeroGallery({
  images, alt, backHref, backLabel, shareUrl, shareTitle,
  unitId, initialFavorited, isAuthenticated, lang,
}: Props) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + count) % count);
  }, [count]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!lightbox) return;
    if (e.key === "Escape") setLightbox(false);
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  }, [lightbox, go]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  if (count === 0) {
    return (
      <div style={{ ...mainImageArea, background: "#111" }} className="unit-hero-main">
        <Link href={backHref} style={backBtn}><ArrowLeft size={18} /></Link>
        <div style={heroActionsWrap}>
          <FavoriteButton
            unitId={unitId}
            initialFavorited={initialFavorited}
            isAuthenticated={isAuthenticated}
            lang={lang}
            label={alt}
            location="unit_page_hero"
            variant="hero"
          />
          <ShareButton url={shareUrl} title={shareTitle} variant="hero" />
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={mainImageArea} className="unit-hero-main">
        <Image key={images[index]} src={images[index]} alt={alt} fill style={{ objectFit: "cover" }} priority sizes="100vw" />

        <Link href={backHref} style={backBtn} aria-label={backLabel}>
          <ArrowLeft size={18} />
        </Link>

        <div style={heroActionsWrap}>
          <FavoriteButton
            unitId={unitId}
            initialFavorited={initialFavorited}
            isAuthenticated={isAuthenticated}
            lang={lang}
            label={alt}
            location="unit_page_hero"
            variant="hero"
          />
          <ShareButton url={shareUrl} title={shareTitle} variant="hero" />
        </div>

        {count > 1 && (
          <>
            <button type="button" style={{ ...navBtn, left: 16 }} onClick={() => go(-1)} aria-label="Anterior">
              <ChevronLeft size={20} />
            </button>
            <button type="button" style={{ ...navBtn, right: 16 }} onClick={() => go(1)} aria-label="Siguiente">
              <ChevronRight size={20} />
            </button>
            <span style={counterPill}>{index + 1} / {count}</span>
          </>
        )}

        <button type="button" style={expandBtn} onClick={() => setLightbox(true)} aria-label="Ver todas las fotos">
          <Expand size={16} /> Ver fotos
        </button>
      </div>

      {count > 1 && (
        <div style={thumbStrip}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              style={{ ...thumbBtn, outline: i === index ? "2px solid #111" : "none", opacity: i === index ? 1 : 0.7 }}
            >
              <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="120px" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div style={overlay} onClick={() => setLightbox(false)}>
          <div style={lightboxWrap} onClick={(e) => e.stopPropagation()}>
            <button style={closeBtn} onClick={() => setLightbox(false)} aria-label="Cerrar"><X size={20} /></button>

            <div style={imageArea}>
              <Image key={images[index]} src={images[index]} alt={alt} fill style={{ objectFit: "contain" }} priority />
            </div>

            {count > 1 && (
              <>
                <button style={{ ...lightboxNavBtn, left: 12 }} onClick={() => go(-1)} aria-label="Anterior"><ChevronLeft size={22} /></button>
                <button style={{ ...lightboxNavBtn, right: 12 }} onClick={() => go(1)} aria-label="Siguiente"><ChevronRight size={22} /></button>
              </>
            )}

            <div style={footer}>
              <span style={counter}>{index + 1} / {count}</span>
              <div style={strip}>
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setIndex(i)}
                    style={{ ...stripThumb, outline: i === index ? "2px solid #fff" : "none", outlineOffset: 2, opacity: i === index ? 1 : 0.5 }}
                  >
                    <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="60px" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const wrap: React.CSSProperties = { background: "#f3f4f6" };
const mainImageArea: React.CSSProperties = { position: "relative", width: "100%", height: 440, background: "#111", overflow: "hidden" };

const backBtn: React.CSSProperties = {
  position: "absolute", top: 16, left: 16, zIndex: 5,
  width: 38, height: 38, borderRadius: "50%",
  background: "rgba(17,17,17,0.55)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  textDecoration: "none", backdropFilter: "blur(2px)",
};

// Row of floating circular actions (share, and later favorites) mirroring the back button on the opposite corner.
const heroActionsWrap: React.CSSProperties = {
  position: "absolute", top: 16, right: 16, zIndex: 5,
  display: "flex", alignItems: "center", gap: "0.5rem",
};

const navBtn: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 5,
  width: 40, height: 40, borderRadius: "50%", border: "none",
  background: "rgba(17,17,17,0.45)", color: "#fff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)",
};

const counterPill: React.CSSProperties = {
  position: "absolute", left: 16, bottom: 16, zIndex: 5,
  background: "rgba(17,17,17,0.55)", color: "#fff", fontSize: "0.78rem", fontWeight: 600,
  padding: "0.3rem 0.65rem", borderRadius: 999,
};

const expandBtn: React.CSSProperties = {
  position: "absolute", right: 16, bottom: 16, zIndex: 5,
  display: "flex", alignItems: "center", gap: "0.4rem",
  background: "#fff", color: "#111", fontSize: "0.8rem", fontWeight: 700,
  padding: "0.5rem 0.85rem", borderRadius: 8, border: "none", cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
};

const thumbStrip: React.CSSProperties = {
  display: "flex", gap: "0.5rem", overflowX: "auto",
  padding: "0.6rem 1rem", background: "#fff", borderBottom: "1px solid #e5e7eb",
};
const thumbBtn: React.CSSProperties = {
  position: "relative", width: 84, height: 60, flexShrink: 0, borderRadius: 6,
  overflow: "hidden", border: "none", padding: 0, cursor: "pointer", background: "#f3f4f6",
  transition: "opacity 0.15s",
};

/* Lightbox */
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const lightboxWrap: React.CSSProperties = { position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column" };
const imageArea: React.CSSProperties = { position: "relative", flex: 1, margin: "3rem 4rem 0" };
const closeBtn: React.CSSProperties = {
  position: "absolute", top: 16, right: 20, zIndex: 10,
  background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
  width: 36, height: 36, borderRadius: "50%", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const lightboxNavBtn: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
  width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
};
const footer: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem" };
const counter: React.CSSProperties = { color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" };
const strip: React.CSSProperties = { display: "flex", gap: "0.4rem", overflowX: "auto", maxWidth: "90vw", padding: "0.25rem 0" };
const stripThumb: React.CSSProperties = {
  position: "relative", width: 56, height: 56, flexShrink: 0,
  borderRadius: 4, overflow: "hidden", border: "none",
  cursor: "pointer", transition: "opacity 0.2s, outline 0.15s",
  background: "rgba(255,255,255,0.1)",
};
