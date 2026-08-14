"use client";

import Image from "next/image";
import Link from "next/link";

type Props = {
  lang: string;
  developmentId: string;
  developmentImages: string[];
  interiorImages: string[];
  planImages: string[];
  onChangeInterior: (images: string[]) => void;
  onChangePlan: (images: string[]) => void;
};

export default function UnitImagePicker({
  lang, developmentId, developmentImages, interiorImages, planImages, onChangeInterior, onChangePlan,
}: Props) {
  if (developmentImages.length === 0) {
    return (
      <div style={emptyBox}>
        <p style={{ margin: 0 }}>El emprendimiento todavía no tiene fotos cargadas.</p>
        <Link href={`/${lang}/admin/developments/${developmentId}/edit`} style={emptyLink}>
          Cargar fotos en el emprendimiento →
        </Link>
      </div>
    );
  }

  function toggle(src: string, list: string[], setThis: (v: string[]) => void, setOther: (v: string[]) => void, other: string[]) {
    if (list.includes(src)) {
      setThis(list.filter((s) => s !== src));
    } else {
      setThis([...list, src]);
      if (other.includes(src)) setOther(other.filter((s) => s !== src));
    }
  }

  return (
    <div style={wrap}>
      <PickerGrid
        label="Fotos de interior"
        images={developmentImages}
        selected={interiorImages}
        onToggle={(src) => toggle(src, interiorImages, onChangeInterior, onChangePlan, planImages)}
      />
      <PickerGrid
        label="Planos"
        images={developmentImages}
        selected={planImages}
        onToggle={(src) => toggle(src, planImages, onChangePlan, onChangeInterior, interiorImages)}
      />
    </div>
  );
}

function PickerGrid({
  label, images, selected, onToggle,
}: {
  label: string;
  images: string[];
  selected: string[];
  onToggle: (src: string) => void;
}) {
  return (
    <div>
      <p style={sectionLabel}>{label} <span style={countHint}>({selected.length})</span></p>
      <div style={grid}>
        {images.map((src) => {
          const pos = selected.indexOf(src);
          const isSelected = pos !== -1;
          return (
            <button
              key={src}
              type="button"
              onClick={() => onToggle(src)}
              style={{ ...thumb, outline: isSelected ? "2px solid #111" : "1px solid #e5e7eb", opacity: isSelected ? 1 : 0.55 }}
              title={isSelected ? "Quitar" : "Seleccionar"}
            >
              <Image src={src} alt="" fill style={{ objectFit: "cover", borderRadius: 6 }} />
              {isSelected && <span style={badge}>{pos + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.25rem" };
const sectionLabel: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#374151", margin: "0 0 0.5rem" };
const countHint: React.CSSProperties = { fontWeight: 400, color: "#9ca3af" };
const grid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem",
};
const thumb: React.CSSProperties = {
  position: "relative", aspectRatio: "1", borderRadius: 6, overflow: "hidden",
  border: "none", background: "#f9fafb", cursor: "pointer", padding: 0,
  outlineOffset: 2, transition: "opacity 0.15s, outline 0.1s",
};
const badge: React.CSSProperties = {
  position: "absolute", bottom: 4, left: 4,
  background: "rgba(0,0,0,0.7)", color: "#fff",
  fontSize: "0.65rem", fontWeight: 700, borderRadius: 4,
  padding: "0.1rem 0.35rem", lineHeight: 1.4,
};
const emptyBox: React.CSSProperties = {
  background: "#f9fafb", border: "1px dashed #d1d5db", borderRadius: 8,
  padding: "1.25rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem",
};
const emptyLink: React.CSSProperties = { display: "inline-block", marginTop: "0.5rem", color: "#111", fontWeight: 600, fontSize: "0.85rem" };
