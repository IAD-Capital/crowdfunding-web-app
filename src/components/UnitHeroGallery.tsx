"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import ShareButton from "./ShareButton";
import FavoriteButton from "./FavoriteButton";

type Props = {
  images: string[];
  alt: string;
  backHref: string;
  shareUrl: string;
  shareTitle: string;
  unitId: number;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  lang: string;
};

export default function UnitHeroGallery({
  images, alt, backHref, shareUrl, shareTitle,
  unitId, initialFavorited, isAuthenticated, lang,
}: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const count = images.length;

  // Prefer returning to wherever the user actually came from (catalog, home,
  // another unit's related-units row, etc.) over always sending them to this
  // unit's development page — only fall back to backHref when there's no
  // in-app history to go back to (e.g. a shared link opened directly).
  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref);
    }
  }, [router, backHref]);

  const go = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + count) % count);
  }, [count]);

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setLightbox(true);
  }, []);

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
      <div style={wrap} className="unit-hero-wrap">
        <style>{`
          @media (min-width: 1200px) {
            .unit-hero-wrap { padding-left: 0 !important; padding-right: 0 !important; }
          }
        `}</style>
        <div style={mainImageArea} className="unit-hero-main">
          <button type="button" onClick={handleBack} style={backBtn} aria-label="Volver"><ArrowLeft size={18} /></button>
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
      </div>
    );
  }

  const gridExtras = images.slice(1, 5);
  const hiddenCount = images.length - 5;

  return (
    <div style={wrap} className="unit-hero-wrap">
      <style>{`
        @media (min-width: 1200px) {
          .unit-hero-wrap { padding-left: 0 !important; padding-right: 0 !important; }
        }
      `}</style>
      {count > 1 && (
        <style>{`
          .unit-hero-collage { display: none; }
          @media (min-width: 768px) {
            .unit-hero-carousel { display: none !important; }
            .unit-hero-collage { display: grid !important; }
          }
        `}</style>
      )}

      {/* Desktop / tablet — collage: one large image plus up to four smaller ones */}
      {count > 1 && (
        <div style={collageWrap} className="unit-hero-collage">
          <button type="button" style={collageMain} onClick={() => openAt(0)} aria-label="Ver foto 1">
            <Image src={images[0]} alt={alt} fill style={{ objectFit: "cover" }} priority sizes="50vw" />
          </button>
          <div style={collageGrid}>
            {gridExtras.map((src, i) => {
              const realIndex = i + 1;
              const showMoreOverlay = i === gridExtras.length - 1 && hiddenCount > 0;
              return (
                <button
                  key={src}
                  type="button"
                  style={collageCell}
                  onClick={() => openAt(realIndex)}
                  aria-label={`Ver foto ${realIndex + 1}`}
                >
                  <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="25vw" />
                  {showMoreOverlay && (
                    <span style={moreOverlay}>
                      <Expand size={18} />
                      +{hiddenCount} fotos
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={handleBack} style={backBtn} aria-label="Volver">
            <ArrowLeft size={18} />
          </button>
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
          {hiddenCount <= 0 && (
            <button type="button" style={expandBtn} onClick={() => setLightbox(true)} aria-label="Ver todas las fotos">
              <Expand size={16} /> Ver fotos
            </button>
          )}
        </div>
      )}

      {/* Mobile — swipeable single-image carousel (and the fallback for a single photo) */}
      <div className="unit-hero-carousel">
        <div style={mainImageArea} className="unit-hero-main">
          <Image key={images[index]} src={images[index]} alt={alt} fill style={{ objectFit: "cover" }} priority sizes="100vw" />

          <button type="button" onClick={handleBack} style={backBtn} aria-label="Volver">
            <ArrowLeft size={18} />
          </button>

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
      </div>

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

const wrap: React.CSSProperties = { maxWidth: "calc(1200px + 10vw)", margin: "0 auto", padding: "0 1.5rem", background: "transparent" };
const mainImageArea: React.CSSProperties = { position: "relative", width: "100%", height: 440, background: "#e5e7eb", overflow: "hidden", borderRadius: 16 };

/* Collage (desktop/tablet) — one large photo plus up to four smaller ones, Airbnb-style */
const collageWrap: React.CSSProperties = {
  position: "relative", gridTemplateColumns: "1fr 1fr", gap: 8, height: 480,
  borderRadius: 16, overflow: "hidden", background: "#e5e7eb",
};
const collageMain: React.CSSProperties = {
  position: "relative", border: "none", padding: 0, margin: 0, cursor: "pointer",
  background: "#e5e7eb", overflow: "hidden", height: "100%", display: "block",
};
const collageGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 8, height: "100%",
};
const collageCell: React.CSSProperties = {
  position: "relative", border: "none", padding: 0, margin: 0, cursor: "pointer",
  background: "#e5e7eb", overflow: "hidden", display: "block",
};
const moreOverlay: React.CSSProperties = {
  position: "absolute", inset: 0, background: "rgba(17,17,17,0.6)", color: "#fff",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: "0.35rem", fontSize: "0.85rem", fontWeight: 700,
};

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
