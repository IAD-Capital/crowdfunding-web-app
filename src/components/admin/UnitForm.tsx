"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/i18n";
import UnitImagePicker from "./UnitImagePicker";
import DeleteWithConfirmButton from "./DeleteWithConfirmButton";

type T = Dictionary["admin"]["units"];

export type Initial = {
  id: number;
  identifier: string;
  floor?: number;
  total_m2?: number;
  covered_m2?: number;
  uncovered_m2?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  orientation?: string;
  price_usd: number;
  current_price_usd?: number | null;
  status: string;
  description?: string;
  images?: string[];
  plan_images?: string[];
  group_duration_months?: number | null;
};

type Props = {
  t: T;
  lang: string;
  developmentId: string;
  developmentName: string;
  initial?: Initial;
  developmentImages?: string[];
  developmentInteriorImages?: string[];
  developmentPlanImages?: string[];
};

export default function UnitForm({
  t, lang, developmentId, developmentName, initial,
  developmentImages = [], developmentInteriorImages = [], developmentPlanImages = [],
}: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [identifier, setIdentifier] = useState(initial?.identifier ?? "");
  const [floor, setFloor] = useState(initial?.floor?.toString() ?? "");
  const [totalM2, setTotalM2] = useState(initial?.total_m2?.toString() ?? "");
  const [coveredM2, setCoveredM2] = useState(initial?.covered_m2?.toString() ?? "");
  const [uncoveredM2, setUncoveredM2] = useState(initial?.uncovered_m2?.toString() ?? "");
  const [rooms, setRooms] = useState(initial?.rooms?.toString() ?? "");
  const [bedrooms, setBedrooms] = useState(initial?.bedrooms?.toString() ?? "");
  const [bathrooms, setBathrooms] = useState(initial?.bathrooms?.toString() ?? "");
  const [orientation, setOrientation] = useState(initial?.orientation ?? "");
  const [priceUsd, setPriceUsd] = useState(initial?.price_usd?.toString() ?? "");
  const [currentPriceUsd, setCurrentPriceUsd] = useState(initial?.current_price_usd?.toString() ?? "");
  const [status, setStatus] = useState(initial?.status ?? "available");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [planImages, setPlanImages] = useState<string[]>(initial?.plan_images ?? []);
  const [groupDurationMonths, setGroupDurationMonths] = useState<string>(
    initial?.group_duration_months?.toString() ?? ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !priceUsd) {
      setError(t.form.errorRequired);
      return;
    }

    setLoading(true);

    const body = {
      identifier: identifier.trim(),
      floor: floor ? parseInt(floor) : null,
      total_m2: totalM2 ? parseFloat(totalM2) : null,
      covered_m2: coveredM2 ? parseFloat(coveredM2) : null,
      uncovered_m2: uncoveredM2 ? parseFloat(uncoveredM2) : null,
      rooms: rooms ? parseInt(rooms) : null,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      orientation: orientation || null,
      price_usd: parseFloat(priceUsd),
      current_price_usd: currentPriceUsd ? parseFloat(currentPriceUsd) : null,
      status,
      description: description.trim() || null,
      images,
      plan_images: planImages,
      group_duration_months: groupDurationMonths ? parseInt(groupDurationMonths) : null,
    };

    const url = isEdit
      ? `/api/admin/units/${initial!.id}`
      : `/api/admin/developments/${developmentId}/units`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }

    router.push(`/${lang}/admin/developments/${developmentId}`);
    router.refresh();
  }

  const orientationKeys = Object.keys(t.form.orientations) as Array<keyof typeof t.form.orientations>;

  return (
    <div style={wrap}>
      <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: "0.25rem" }}>{developmentName}</p>
      <h1 style={title}>{isEdit ? t.form.titleEdit : t.form.titleNew}</h1>

      <form onSubmit={handleSubmit} style={form}>
        <Row>
          <Field label={t.form.identifier}>
            <input style={input} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="2A" />
          </Field>
          <Field label={t.form.floor}>
            <input style={input} type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
          </Field>
          <Field label={t.form.status}>
            <select style={input} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="available">{t.status.available}</option>
              <option value="partial">{t.status.partial}</option>
              <option value="sold">{t.status.sold}</option>
            </select>
          </Field>
        </Row>

        <Row>
          <Field label={t.form.totalM2}>
            <input style={input} type="number" step="0.01" value={totalM2} onChange={(e) => setTotalM2(e.target.value)} />
          </Field>
          <Field label={t.form.coveredM2}>
            <input style={input} type="number" step="0.01" value={coveredM2} onChange={(e) => setCoveredM2(e.target.value)} />
          </Field>
          <Field label={t.form.uncoveredM2}>
            <input style={input} type="number" step="0.01" value={uncoveredM2} onChange={(e) => setUncoveredM2(e.target.value)} />
          </Field>
        </Row>

        <Row>
          <Field label={t.form.rooms}>
            <input style={input} type="number" min="1" value={rooms} onChange={(e) => setRooms(e.target.value)} />
          </Field>
          <Field label={t.form.bedrooms}>
            <input style={input} type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
          </Field>
          <Field label={t.form.bathrooms}>
            <input style={input} type="number" min="1" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
          </Field>
        </Row>

        <Row>
          <Field label={t.form.orientation}>
            <select style={input} value={orientation} onChange={(e) => setOrientation(e.target.value)}>
              <option value="">—</option>
              {orientationKeys.map((k) => (
                <option key={k} value={k}>{t.form.orientations[k]}</option>
              ))}
            </select>
          </Field>
          <Field label={t.form.priceUsd}>
            <input style={input} type="number" step="0.01" min="0" value={priceUsd}
              onChange={(e) => setPriceUsd(e.target.value)} required />
          </Field>
          <Field label="Precio actual (mercado)">
            <input style={input} type="number" step="0.01" min="0" value={currentPriceUsd}
              onChange={(e) => setCurrentPriceUsd(e.target.value)}
              placeholder="Dejar vacío si no cambió" />
          </Field>
        </Row>

        <Field label={t.form.description}>
          <textarea style={{ ...input, minHeight: 64, resize: "vertical" }}
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Fotos">
          <UnitImagePicker
            lang={lang}
            developmentId={developmentId}
            developmentImages={developmentImages}
            developmentInteriorImages={developmentInteriorImages}
            developmentPlanImages={developmentPlanImages}
            interiorImages={images}
            planImages={planImages}
            onChangeInterior={setImages}
            onChangePlan={setPlanImages}
          />
        </Field>

        <div style={groupSection}>
          <p style={groupLabel}>Grupo de inversión</p>
          <Field label="Duración del grupo">
            <select
              style={input}
              value={groupDurationMonths}
              onChange={(e) => setGroupDurationMonths(e.target.value)}
            >
              <option value="">Sin vencimiento</option>
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
              <option value="24">24 meses</option>
            </select>
          </Field>
          <p style={groupHint}>
            La fecha de vencimiento se calcula automáticamente desde la primera inversión activa en la unidad.
            Si esa inversión se cancela, el contador se reinicia.
          </p>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <div style={actions}>
          {isEdit && (
            <DeleteWithConfirmButton
              deleteUrl={`/api/admin/units/${initial!.id}`}
              confirmText={initial!.identifier}
              redirectTo={`/${lang}/admin/developments/${developmentId}`}
            />
          )}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => router.back()} style={btnSecondary}>
            {t.form.cancel}
          </button>
          <button type="submit" style={btnPrimary} disabled={loading}>
            {loading ? t.form.submitting : t.form.submit}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flex: 1, minWidth: 140 }}>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>{children}</div>;
}

const wrap: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: "2rem", border: "1px solid #e5e7eb" };
const title: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" };
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db",
  borderRadius: 8, fontSize: "0.9rem", width: "100%", outline: "none",
};
const errorStyle: React.CSSProperties = { color: "#dc2626", fontSize: "0.875rem" };
const actions: React.CSSProperties = { display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" };
const btnPrimary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.6rem 1.25rem", background: "#fff", color: "#111",
  border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: "0.9rem",
};
const groupSection: React.CSSProperties = {
  background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "1rem 1.25rem",
  display: "flex", flexDirection: "column", gap: "0.75rem",
};
const groupLabel: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 700, color: "#0369a1", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" };
const groupHint: React.CSSProperties = { fontSize: "0.75rem", color: "#0284c7", margin: 0, lineHeight: 1.5 };
