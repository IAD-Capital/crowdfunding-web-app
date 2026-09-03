"use client";

import { useState, useRef, FormEvent } from "react";
import Image from "next/image";
import { X } from "lucide-react";

const MAX_PHOTOS = 3;
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

export default function DeveloperContactForm() {
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setResult(null);
    const available = MAX_PHOTOS - photos.length;
    const selected = Array.from(files).slice(0, available);
    const oversized = selected.find((f) => f.size > MAX_PHOTO_SIZE);
    if (oversized) {
      setResult({ ok: false, message: "Cada foto debe pesar menos de 5 MB." });
      return;
    }
    setPhotos((prev) => [...prev, ...selected]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    const fd = new FormData();
    fd.append("fullName", fullName);
    fd.append("company", company);
    fd.append("email", email);
    fd.append("phone", phone);
    fd.append("address", address);
    fd.append("details", details);
    photos.forEach((p) => fd.append("photos", p));

    const res = await fetch("/api/public/contact/developer", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult({ ok: false, message: data.error ?? "No se pudo enviar el mensaje." });
      return;
    }
    setResult({ ok: true, message: "¡Gracias! Recibimos la propuesta y te vamos a contactar a la brevedad." });
    setFullName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setAddress("");
    setDetails("");
    setPhotos([]);
  }

  if (result?.ok) {
    return (
      <div style={successBox}>
        <p style={successText}>{result.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={form}>
      <div style={row} className="contact-form-row">
        <Field label="Nombre completo">
          <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="Desarrolladora / Empresa">
          <input style={input} value={company} onChange={(e) => setCompany(e.target.value)} required />
        </Field>
      </div>
      <div style={row} className="contact-form-row">
        <Field label="Email">
          <input type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Teléfono">
          <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
      </div>
      <Field label="Dirección de la unidad">
        <input style={input} value={address} onChange={(e) => setAddress(e.target.value)} required />
      </Field>
      <Field label="Detalles de la unidad">
        <textarea
          style={textarea}
          rows={4}
          placeholder="Superficie, ambientes, precio, estado, etc."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          required
        />
      </Field>

      <Field label={`Fotos (máximo ${MAX_PHOTOS})`}>
        <div style={photosGrid}>
          {photos.map((file, i) => (
            <div key={i} style={photoThumb}>
              <Image src={URL.createObjectURL(file)} alt="" fill style={{ objectFit: "cover" }} unoptimized />
              <button type="button" onClick={() => removePhoto(i)} style={removeBtn} aria-label="Quitar foto">
                <X size={13} />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button type="button" onClick={() => inputRef.current?.click()} style={addBtn}>
              <span style={{ fontSize: "1.4rem", color: "#9ca3af", lineHeight: 1 }}>+</span>
              <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>Agregar</span>
            </button>
          )}
        </div>
        <input
          ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </Field>

      {result && !result.ok && <p style={errorStyle}>{result.message}</p>}

      <button type="submit" style={btnPrimary} disabled={loading}>
        {loading ? "Enviando…" : "Enviar propuesta"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={fieldWrap}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1rem" };
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" };
const fieldWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem" };
const fieldLabel: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 600, color: "#374151" };
const input: React.CSSProperties = {
  padding: "0.65rem 0.8rem", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: "0.9rem", width: "100%", outline: "none", background: "#fff",
};
const textarea: React.CSSProperties = { ...input, resize: "vertical", fontFamily: "inherit" };
const errorStyle: React.CSSProperties = { fontSize: "0.82rem", color: "#dc2626", margin: 0 };
const btnPrimary: React.CSSProperties = {
  padding: "0.75rem 1.5rem", background: "#111", color: "#fff",
  borderRadius: 10, fontWeight: 700, fontSize: "0.92rem", border: "none", cursor: "pointer",
};
const successBox: React.CSSProperties = {
  padding: "1.5rem", background: "#f0fdf4", border: "1px solid #86efac",
  borderRadius: 12, textAlign: "center",
};
const successText: React.CSSProperties = { color: "#166534", fontWeight: 600, margin: 0, fontSize: "0.92rem" };

const photosGrid: React.CSSProperties = { display: "flex", gap: "0.6rem", flexWrap: "wrap" };
const photoThumb: React.CSSProperties = {
  position: "relative", width: 84, height: 84, borderRadius: 8, overflow: "hidden",
  border: "1px solid #e5e7eb", background: "#f9fafb",
};
const removeBtn: React.CSSProperties = {
  position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: "50%",
  background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
};
const addBtn: React.CSSProperties = {
  width: 84, height: 84, border: "2px dashed #d1d5db", borderRadius: 8,
  background: "#fff", cursor: "pointer",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.15rem",
};
