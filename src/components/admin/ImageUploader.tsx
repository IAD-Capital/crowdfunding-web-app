"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";

const DEFAULT_MAX = 30;

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  existingImages?: string[];
};

export default function ImageUploader({ images, onChange, max = DEFAULT_MAX, existingImages = [] }: Props) {
  const MAX = max;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Keyboard navigation for lightbox
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

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox !== null ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setError("");
    const available = MAX - images.length;
    const selected = Array.from(files).slice(0, available);
    if (files.length > available) {
      setError(`Máximo ${MAX} fotos. Se ignoraron ${files.length - available} archivo(s).`);
    }
    setUploading(true);
    const paths: string[] = [];
    for (const file of selected) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al subir imagen."); break; }
      paths.push(data.path);
    }
    setUploading(false);
    if (paths.length) onChange([...images, ...paths]);
  }

  function remove(index: number) {
    const next = [...images];
    next.splice(index, 1);
    onChange(next);
    if (lightbox !== null) {
      if (next.length === 0) setLightbox(null);
      else setLightbox(Math.min(lightbox, next.length - 1));
    }
  }

  function onDragStart(index: number) { dragIndex.current = index; }
  function onDragEnter(index: number) { setDragOver(index); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDrop(dropIndex: number) {
    const from = dragIndex.current;
    if (from === null || from === dropIndex) { dragIndex.current = null; setDragOver(null); return; }
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(dropIndex, 0, moved);
    onChange(next);
    dragIndex.current = null;
    setDragOver(null);
  }
  function onDragEnd() { dragIndex.current = null; setDragOver(null); }

  function selectExisting(src: string) {
    if (images.includes(src) || images.length >= MAX) return;
    onChange([...images, src]);
  }

  const canAdd = images.length < MAX;
  const pickerImages = existingImages.filter((src) => !images.includes(src));

  return (
    <>
      <div>
        <div style={grid}>
          {images.map((src, i) => (
            <div
              key={src}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(i)}
              onDragEnd={onDragEnd}
              style={{
                ...thumb,
                outline: dragOver === i ? "2px solid #111" : "none",
                outlineOffset: 2,
                opacity: dragIndex.current === i ? 0.4 : 1,
              }}
            >
              <Image
                src={src} alt="" fill
                style={{ objectFit: "cover", borderRadius: 6, pointerEvents: "none" }}
              />
              <span style={badge}>{i + 1}</span>

              {/* Preview trigger */}
              <button
                type="button"
                onClick={() => setLightbox(i)}
                style={previewBtn}
                title="Ver foto"
              />

              <button
                type="button"
                onClick={() => remove(i)}
                style={removeBtn}
                title="Eliminar"
              >×</button>
            </div>
          ))}

          {canAdd && (
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={addBtn}>
              {uploading
                ? <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Subiendo…</span>
                : <>
                    <span style={{ fontSize: "1.5rem", color: "#9ca3af", lineHeight: 1 }}>+</span>
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Agregar foto</span>
                  </>
              }
            </button>
          )}
        </div>

        <p style={hint}>{images.length}/{MAX} fotos · arrastrá para reordenar · clic para previsualizar</p>
        {error && <p style={errorStyle}>{error}</p>}

        <input
          ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={(e) => handleFiles(e.target.files)}
          onClick={(e) => ((e.target as HTMLInputElement).value = "")}
        />

        {pickerImages.length > 0 && (
          <div style={pickerWrap}>
            <p style={pickerLabel}>O elegí una foto ya cargada para este emprendimiento:</p>
            <div style={pickerGrid}>
              {pickerImages.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => selectExisting(src)}
                  style={pickerThumb}
                  disabled={images.length >= MAX}
                  title="Usar esta foto"
                >
                  <Image src={src} alt="" fill style={{ objectFit: "cover", borderRadius: 6 }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && images[lightbox] && (
        <div style={overlay} onClick={() => setLightbox(null)}>
          <div style={lightboxWrap} onClick={(e) => e.stopPropagation()}>

            {/* Close */}
            <button style={closeBtn} onClick={() => setLightbox(null)}>×</button>

            {/* Main image */}
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

            {/* Prev / Next */}
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

            {/* Counter + dots */}
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

              {/* Thumbnail strip */}
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

/* Grid styles */
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
  gap: "0.5rem",
};
const thumb: React.CSSProperties = {
  position: "relative", aspectRatio: "1", borderRadius: 6, overflow: "hidden",
  border: "1px solid #e5e7eb", background: "#f9fafb",
  transition: "outline 0.1s, opacity 0.15s", cursor: "grab",
};
const badge: React.CSSProperties = {
  position: "absolute", bottom: 4, left: 4,
  background: "rgba(0,0,0,0.55)", color: "#fff",
  fontSize: "0.65rem", fontWeight: 700, borderRadius: 4,
  padding: "0.1rem 0.35rem", lineHeight: 1.4, pointerEvents: "none",
};
const previewBtn: React.CSSProperties = {
  position: "absolute", bottom: 4, right: 4,
  width: 22, height: 22, borderRadius: "50%",
  background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer",
  fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center",
};
const removeBtn: React.CSSProperties = {
  position: "absolute", top: 3, right: 3,
  width: 20, height: 20, borderRadius: "50%",
  background: "rgba(0,0,0,0.55)", color: "#fff", border: "none",
  cursor: "pointer", fontSize: "0.9rem", lineHeight: 1,
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};
const addBtn: React.CSSProperties = {
  aspectRatio: "1", border: "2px dashed #d1d5db", borderRadius: 6,
  background: "#fff", cursor: "pointer",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.15rem",
};
const hint: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.4rem" };
const errorStyle: React.CSSProperties = { fontSize: "0.8rem", color: "#dc2626", marginTop: "0.25rem" };

/* Existing-photos picker */
const pickerWrap: React.CSSProperties = { marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #f3f4f6" };
const pickerLabel: React.CSSProperties = { fontSize: "0.75rem", color: "#6b7280", margin: "0 0 0.5rem" };
const pickerGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "0.4rem",
};
const pickerThumb: React.CSSProperties = {
  position: "relative", aspectRatio: "1", borderRadius: 6, overflow: "hidden",
  border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", padding: 0,
};

/* Lightbox styles */
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000,
  background: "rgba(0,0,0,0.92)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const lightboxWrap: React.CSSProperties = {
  position: "relative", width: "100%", height: "100%",
  display: "flex", flexDirection: "column",
};
const imageArea: React.CSSProperties = {
  position: "relative", flex: 1, margin: "3rem 4rem 0",
};
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
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 10,
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
