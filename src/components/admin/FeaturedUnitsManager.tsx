"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUp, ArrowDown, X, Plus } from "lucide-react";

export type UnitOption = {
  id: number;
  identifier: string;
  images: string[];
  price_usd: number;
  total_m2: number | null;
  rooms: number | null;
  featured: boolean;
  featured_order: number | null;
  development_name: string;
  development_address: string;
};

type Props = { lang: string; units: UnitOption[] };

const MAX_FEATURED = 8;

export default function FeaturedUnitsManager({ units }: Props) {
  const router = useRouter();
  const [featuredIds, setFeaturedIds] = useState<number[]>(
    units.filter((u) => u.featured).sort((a, b) => (a.featured_order ?? 0) - (b.featured_order ?? 0)).map((u) => u.id)
  );
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const byId = useMemo(() => new Map(units.map((u) => [u.id, u])), [units]);
  const featured = featuredIds.map((id) => byId.get(id)).filter((u): u is UnitOption => !!u);

  const available = units
    .filter((u) => !featuredIds.includes(u.id))
    .filter((u) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return u.identifier.toLowerCase().includes(q) || u.development_name.toLowerCase().includes(q);
    });

  function add(id: number) {
    if (featuredIds.length >= MAX_FEATURED) return;
    setFeaturedIds((prev) => [...prev, id]);
    setSuccess(false);
  }

  function remove(id: number) {
    setFeaturedIds((prev) => prev.filter((i) => i !== id));
    setSuccess(false);
  }

  function move(index: number, dir: -1 | 1) {
    setFeaturedIds((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSuccess(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/admin/units/featured", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit_ids: featuredIds }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
    setSuccess(true);
    router.refresh();
  }

  const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

  return (
    <div style={wrap}>
      <div style={section}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Seleccionadas <span style={countBadge}>{featured.length}/{MAX_FEATURED}</span></h2>
        </div>

        {featured.length === 0 ? (
          <p style={emptyHint}>No hay unidades destacadas todavía. Agregá alguna de la lista de abajo.</p>
        ) : (
          <div style={list}>
            {featured.map((u, i) => (
              <div key={u.id} style={row}>
                <span style={orderBadge}>{i + 1}</span>
                <div style={thumbWrap}>
                  {u.images[0] ? (
                    <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={thumbPlaceholder} />
                  )}
                </div>
                <div style={rowInfo}>
                  <p style={rowTitle}>{u.identifier} · {u.development_name}</p>
                  <p style={rowSub}>{u.development_address} · {fmtUsd(u.price_usd)}</p>
                </div>
                <div style={rowActions}>
                  <button type="button" style={iconBtn} onClick={() => move(i, -1)} disabled={i === 0} title="Subir">
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" style={iconBtn} onClick={() => move(i, 1)} disabled={i === featured.length - 1} title="Bajar">
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" style={{ ...iconBtn, color: "#dc2626" }} onClick={() => remove(u.id)} title="Quitar">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p style={errorMsg}>{error}</p>}
        {success && <p style={successMsg}>Guardado correctamente.</p>}

        <div style={actions}>
          <button type="button" style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div style={section}>
        <div style={sectionHeader}>
          <h2 style={sectionTitle}>Agregar unidad</h2>
          <input
            style={searchInput}
            placeholder="Buscar por identificador o emprendimiento…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {available.length === 0 ? (
          <p style={emptyHint}>No hay más unidades para agregar.</p>
        ) : (
          <div style={list}>
            {available.map((u) => (
              <div key={u.id} style={row}>
                <div style={thumbWrap}>
                  {u.images[0] ? (
                    <Image src={u.images[0]} alt={u.identifier} fill style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={thumbPlaceholder} />
                  )}
                </div>
                <div style={rowInfo}>
                  <p style={rowTitle}>{u.identifier} · {u.development_name}</p>
                  <p style={rowSub}>{u.development_address} · {fmtUsd(u.price_usd)}</p>
                </div>
                <button
                  type="button"
                  style={{ ...addBtn, opacity: featuredIds.length >= MAX_FEATURED ? 0.4 : 1 }}
                  onClick={() => add(u.id)}
                  disabled={featuredIds.length >= MAX_FEATURED}
                  title={featuredIds.length >= MAX_FEATURED ? `Máximo ${MAX_FEATURED}` : "Agregar"}
                >
                  <Plus size={15} /> Agregar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 820 };
const section: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "1.5rem" };
const sectionHeader: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" };
const sectionTitle: React.CSSProperties = { fontSize: "1rem", fontWeight: 700, margin: 0, color: "#111", display: "flex", alignItems: "center", gap: "0.5rem" };
const countBadge: React.CSSProperties = { fontSize: "0.78rem", fontWeight: 600, color: "#6b7280", background: "#f3f4f6", padding: "0.15rem 0.55rem", borderRadius: 999 };
const searchInput: React.CSSProperties = { padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.85rem", minWidth: 240 };

const list: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.5rem" };
const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem", border: "1px solid #f3f4f6", borderRadius: 8 };
const orderBadge: React.CSSProperties = { width: 22, height: 22, borderRadius: "50%", background: "#111", color: "#fff", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const thumbWrap: React.CSSProperties = { position: "relative", width: 48, height: 48, borderRadius: 6, overflow: "hidden", flexShrink: 0, background: "#f3f4f6" };
const thumbPlaceholder: React.CSSProperties = { width: "100%", height: "100%", background: "linear-gradient(135deg, #f9fafb, #e5e7eb)" };
const rowInfo: React.CSSProperties = { flex: 1, minWidth: 0 };
const rowTitle: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 600, margin: 0, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const rowSub: React.CSSProperties = { fontSize: "0.75rem", color: "#9ca3af", margin: "0.1rem 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const rowActions: React.CSSProperties = { display: "flex", gap: "0.25rem", flexShrink: 0 };
const iconBtn: React.CSSProperties = { width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", color: "#374151" };
const addBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.4rem 0.75rem", background: "#111", color: "#fff", border: "none", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 };
const emptyHint: React.CSSProperties = { color: "#9ca3af", fontSize: "0.85rem" };
const errorMsg: React.CSSProperties = { color: "#dc2626", fontSize: "0.85rem", marginTop: "0.75rem" };
const successMsg: React.CSSProperties = { color: "#166534", fontSize: "0.85rem", marginTop: "0.75rem" };
const actions: React.CSSProperties = { display: "flex", justifyContent: "flex-end", marginTop: "1rem" };
const btnPrimary: React.CSSProperties = { padding: "0.6rem 1.5rem", background: "#111", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" };
