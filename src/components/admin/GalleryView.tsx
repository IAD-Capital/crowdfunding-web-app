"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type MediaItem = {
  id: number;
  url: string;
  alt_text: string | null;
  credit: string | null;
  uploaded_at: string;
};

export type GalleryDevelopment = {
  id: number;
  name: string;
  images: MediaItem[];
};

type Props = { developments: GalleryDevelopment[]; lang: string };

export default function GalleryView({ developments, lang }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [detail, setDetail] = useState<MediaItem | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Detail panel state
  const [altText, setAltText] = useState("");
  const [credit, setCredit] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  const allIds = developments.flatMap((d) => d.images.map((i) => i.id));
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleDev(dev: GalleryDevelopment) {
    const ids = dev.images.map((i) => i.id);
    const allIn = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      allIn ? ids.forEach((id) => next.delete(id)) : ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function openDetail(item: MediaItem) {
    setDetail(item);
    setAltText(item.alt_text ?? "");
    setCredit(item.credit ?? "");
    setSaveOk(false);
  }

  async function handleSaveDetail() {
    if (!detail) return;
    setSaving(true);
    setSaveOk(false);
    const res = await fetch(`/api/admin/media/${detail.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt_text: altText, credit }),
    });
    setSaving(false);
    if (res.ok) { setSaveOk(true); router.refresh(); }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`¿Eliminar ${selected.size} imagen${selected.size !== 1 ? "es" : ""}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setDeleting(false);
    setSelected(new Set());
    if (detail && selected.has(detail.id)) setDetail(null);
    router.refresh();
  }

  const copyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
  }, []);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (developments.length === 0) {
    return <p style={{ color: "#6b7280" }}>No hay fotos cargadas todavía.</p>;
  }

  return (
    <div style={wrap}>
      {/* Toolbar */}
      <div style={toolbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label style={checkLabel}>
            <input type="checkbox" checked={allSelected} onChange={toggleAll} style={checkInput} />
            Seleccionar todo
          </label>
          {selected.size > 0 && (
            <span style={selCount}>{selected.size} seleccionada{selected.size !== 1 ? "s" : ""}</span>
          )}
        </div>
        {selected.size > 0 && (
          <button style={btnDanger} onClick={handleBulkDelete} disabled={deleting}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
            {deleting ? "Eliminando…" : `Eliminar ${selected.size}`}
          </button>
        )}
      </div>

      <div style={body}>
        {/* Grid */}
        <div style={gridCol}>
          {developments.map((dev) => {
            const devIds = dev.images.map((i) => i.id);
            const devAllSelected = devIds.length > 0 && devIds.every((id) => selected.has(id));
            return (
              <div key={dev.id} style={section}>
                <div style={sectionHeader}>
                  <label style={checkLabel}>
                    <input type="checkbox" checked={devAllSelected} onChange={() => toggleDev(dev)} style={checkInput} />
                    <span style={sectionTitle}>{dev.name}</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={sectionCount}>{dev.images.length} foto{dev.images.length !== 1 ? "s" : ""}</span>
                    <Link href={`/${lang}/admin/developments/${dev.id}/edit`} style={sectionLink}>Editar →</Link>
                  </div>
                </div>

                {dev.images.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>Sin fotos.</p>
                ) : (
                  <div style={grid}>
                    {dev.images.map((item) => {
                      const isSelected = selected.has(item.id);
                      const isActive = detail?.id === item.id;
                      return (
                        <div key={item.id} style={{ position: "relative" }}>
                          <button
                            type="button"
                            style={{
                              ...thumb,
                              outline: isActive ? "2px solid #1b4de0" : isSelected ? "2px solid #ef4444" : "none",
                              outlineOffset: 2,
                            }}
                            onClick={() => openDetail(item)}
                          >
                            <Image src={item.url} alt={item.alt_text ?? ""} fill style={{ objectFit: "cover" }} />
                          </button>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            style={thumbCheck}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {detail && (
          <div style={panel}>
            <div style={panelHeader}>
              <span style={panelTitle}>Detalles</span>
              <button style={panelClose} onClick={() => setDetail(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Preview */}
            <div style={panelPreview} onClick={() => setLightbox(detail.url)}>
              <Image src={detail.url} alt={detail.alt_text ?? ""} fill style={{ objectFit: "contain" }} />
              <span style={previewHint}>Ver ampliada</span>
            </div>

            {/* File URL */}
            <div style={fieldGroup}>
              <span style={fieldLabel}>URL del archivo</span>
              <div style={urlRow}>
                <span style={urlText}>{detail.url}</span>
                <button style={copyBtn} onClick={() => copyUrl(detail.url)} title="Copiar URL">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Date */}
            <div style={fieldGroup}>
              <span style={fieldLabel}>Fecha de carga</span>
              <span style={fieldValue}>{fmtDate(detail.uploaded_at)}</span>
            </div>

            {/* Alt text */}
            <div style={fieldGroup}>
              <label style={fieldLabel} htmlFor="alt_text">Texto alternativo</label>
              <input
                id="alt_text"
                style={input}
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe la imagen…"
              />
            </div>

            {/* Credit */}
            <div style={fieldGroup}>
              <label style={fieldLabel} htmlFor="credit">Crédito / Autor</label>
              <input
                id="credit"
                style={input}
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                placeholder="© Nombre / Agencia"
              />
            </div>

            <div style={panelActions}>
              {saveOk && <span style={savedMsg}>Guardado</span>}
              <button style={btnPrimary} onClick={handleSaveDetail} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button style={btnDestructive} onClick={() => { setSelected(new Set([detail.id])); handleBulkDelete(); }}>
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div style={overlay} onClick={() => setLightbox(null)}>
          <div style={{ position: "relative", width: "90vw", height: "90vh" }}>
            <Image src={lightbox} alt="" fill style={{ objectFit: "contain" }} priority />
          </div>
          <button style={closeBtn} onClick={() => setLightbox(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */
const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };

const toolbar: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
  padding: "0.65rem 1rem",
};
const checkLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "#374151" };
const checkInput: React.CSSProperties = { width: 15, height: 15, cursor: "pointer", accentColor: "#1b4de0" };
const selCount: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };

const btnDanger: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.4rem",
  padding: "0.4rem 0.85rem", background: "#dc2626", color: "#fff",
  border: "none", borderRadius: 7, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
};

const body: React.CSSProperties = { display: "flex", gap: "1.25rem", alignItems: "flex-start" };
const gridCol: React.CSSProperties = { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1rem" };

const section: React.CSSProperties = { background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", padding: "1.25rem" };
const sectionHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" };
const sectionTitle: React.CSSProperties = { fontSize: "1rem", fontWeight: 700 };
const sectionCount: React.CSSProperties = { fontSize: "0.8rem", color: "#6b7280" };
const sectionLink: React.CSSProperties = { fontSize: "0.8rem", color: "#111", fontWeight: 600, textDecoration: "none" };

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.6rem" };
const thumb: React.CSSProperties = {
  position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden",
  border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", padding: 0, width: "100%",
};
const thumbCheck: React.CSSProperties = {
  position: "absolute", top: 5, left: 5, width: 15, height: 15,
  cursor: "pointer", accentColor: "#1b4de0", zIndex: 2,
};

/* Detail panel */
const panel: React.CSSProperties = {
  width: 280, flexShrink: 0,
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem",
  position: "sticky", top: 76, maxHeight: "calc(100vh - 100px)", overflowY: "auto",
};
const panelHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const panelTitle: React.CSSProperties = { fontWeight: 700, fontSize: "0.9rem" };
const panelClose: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 4, borderRadius: 6 };

const panelPreview: React.CSSProperties = {
  position: "relative", aspectRatio: "16/9", borderRadius: 8, overflow: "hidden",
  background: "#f3f4f6", cursor: "zoom-in",
};
const previewHint: React.CSSProperties = {
  position: "absolute", bottom: 6, right: 6, fontSize: "0.68rem",
  background: "rgba(0,0,0,0.5)", color: "#fff", padding: "2px 6px", borderRadius: 4,
};

const fieldGroup: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.3rem" };
const fieldLabel: React.CSSProperties = { fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" };
const fieldValue: React.CSSProperties = { fontSize: "0.82rem", color: "#111" };
const urlRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.4rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 7, padding: "0.35rem 0.5rem" };
const urlText: React.CSSProperties = { fontSize: "0.72rem", color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const copyBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 2, flexShrink: 0, display: "flex" };

const input: React.CSSProperties = {
  padding: "0.45rem 0.65rem", border: "1px solid #d1d5db", borderRadius: 7,
  fontSize: "0.82rem", background: "#fff",
};

const panelActions: React.CSSProperties = { display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" };
const savedMsg: React.CSSProperties = { fontSize: "0.78rem", color: "#166534", marginRight: "auto" };
const btnPrimary: React.CSSProperties = {
  padding: "0.4rem 0.9rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 7, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
};
const btnDestructive: React.CSSProperties = {
  padding: "0.4rem 0.9rem", background: "none", color: "#dc2626",
  border: "1px solid #fca5a5", borderRadius: 7, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
};

/* Lightbox */
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const closeBtn: React.CSSProperties = {
  position: "absolute", top: 16, right: 20,
  background: "rgba(255,255,255,0.15)", border: "none", color: "#fff",
  width: 40, height: 40, borderRadius: "50%",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
