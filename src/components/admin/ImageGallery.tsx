"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

type Props = { images: string[] };

export default function ImageGallery({ images }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (lightbox === null) return;
    if (e.key === "Escape") setLightbox(null);
    if (e.key === "ArrowRight") setLightbox((i) => (i! + 1) % images.length);
    if (e.key === "ArrowLeft") setLightbox((i) => (i! - 1 + images.length) % images.length);
  }, [lightbox, images.length]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  if (!images.length) return null;

  return (
    <>
      {/* Thumbnail grid */}
      <div style={grid}>
        {images.map((src, i) => (
          <button key={src} type="button" onClick={() => setLightbox(i)} style={thumb}>
            <Image src={src} alt="" fill style={{ objectFit: "cover", borderRadius: 6, pointerEvents: "none" }} />
            <div style={thumbOverlay} />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div style={overlay} onClick={() => setLightbox(null)}>
          <div style={lightboxWrap} onClick={(e) => e.stopPropagation()}>

            <button style={closeBtn} onClick={() => setLightbox(null)}>×</button>

            <div style={imageArea}>
              <Image
                key={images[lightbox]}
                src={images[lightbox]}
                alt=""
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>

            {images.length > 1 && (
              <>
                <button
                  style={{ ...navBtn, left: 12 }}
                  onClick={() => setLightbox((lightbox - 1 + images.length) % images.length)}
                >‹</button>
                <button
                  style={{ ...navBtn, right: 12 }}
                  onClick={() => setLightbox((lightbox + 1) % images.length)}
                >›</button>
              </>
            )}

            <div style={footer}>
              <span style={counter}>{lightbox + 1} / {images.length}</span>
              <div style={dots}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox(i)}
                    style={{
                      ...dot,
                      background: i === lightbox ? "#fff" : "rgba(255,255,255,0.35)",
                      transform: i === lightbox ? "scale(1.25)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
              <div style={strip}>
                {images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setLightbox(i)}
                    style={{
                      ...stripThumb,
                      outline: i === lightbox ? "2px solid #fff" : "none",
                      outlineOffset: 2,
                      opacity: i === lightbox ? 1 : 0.5,
                    }}
                  >
                    <Image src={src} alt="" fill style={{ objectFit: "cover", borderRadius: 4, pointerEvents: "none" }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
  gap: "0.5rem",
};
const thumb: React.CSSProperties = {
  position: "relative", aspectRatio: "1", borderRadius: 6, overflow: "hidden",
  border: "1px solid #e5e7eb", background: "#f9fafb",
  cursor: "pointer", padding: 0,
};
const thumbOverlay: React.CSSProperties = {
  position: "absolute", inset: 0, background: "rgba(0,0,0,0)",
  display: "flex", alignItems: "center", justifyContent: "center",
  opacity: 0, transition: "all 0.15s",
};
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000,
  background: "rgba(0,0,0,0.92)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const lightboxWrap: React.CSSProperties = {
  position: "relative", width: "100%", height: "100%",
  display: "flex", flexDirection: "column",
};
const imageArea: React.CSSProperties = { position: "relative", flex: 1, margin: "3rem 4rem 0" };
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
const footer: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  gap: "0.75rem", padding: "1rem",
};
const counter: React.CSSProperties = { color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" };
const dots: React.CSSProperties = { display: "flex", gap: "0.4rem" };
const dot: React.CSSProperties = {
  width: 7, height: 7, borderRadius: "50%", border: "none",
  cursor: "pointer", padding: 0, transition: "all 0.2s",
};
const strip: React.CSSProperties = {
  display: "flex", gap: "0.4rem", overflowX: "auto", maxWidth: "90vw", padding: "0.25rem 0",
};
const stripThumb: React.CSSProperties = {
  position: "relative", width: 52, height: 52, flexShrink: 0,
  borderRadius: 4, overflow: "hidden", border: "none",
  cursor: "pointer", transition: "opacity 0.2s, outline 0.15s",
  background: "rgba(255,255,255,0.1)",
};
