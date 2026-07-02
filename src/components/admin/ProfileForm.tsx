"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  initial: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    avatar: string | null;
    phone: string | null;
    alternate_email: string | null;
  };
};

export default function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(initial.full_name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [alternateEmail, setAlternateEmail] = useState(initial.alternate_email ?? "");
  const [avatar, setAvatar] = useState<string | null>(initial.avatar);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAvatarChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error ?? "Error al subir imagen."); return; }
    setAvatar(data.path);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password && password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone,
        alternate_email: alternateEmail,
        avatar,
        ...(password ? { password } : {}),
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
    setSuccess(true);
    setPassword("");
    setConfirmPassword("");
    router.refresh();
  }

  const initials = fullName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <form onSubmit={handleSubmit} style={form}>
      {/* Avatar */}
      <div style={avatarSection}>
        <div style={avatarWrap}>
          {avatar ? (
            <Image src={avatar} alt="Avatar" width={96} height={96} style={avatarImg} />
          ) : (
            <div style={avatarFallback}>{initials}</div>
          )}
          <button
            type="button"
            style={avatarOverlay}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Cambiar foto"
          >
            {uploading ? "…" : "✎"}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
        />
        <div>
          <p style={avatarName}>{fullName}</p>
          <p style={avatarRole}>{initial.role === "superadmin" ? "Superadmin" : "Inversor"}</p>
          <button type="button" style={changePhotoBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "Subiendo…" : "Cambiar foto"}
          </button>
          {avatar && (
            <button type="button" style={removePhotoBtn} onClick={() => setAvatar(null)}>
              Quitar foto
            </button>
          )}
        </div>
      </div>

      <div style={divider} />

      {/* Fields */}
      <div style={grid}>
        <div style={fieldGroup}>
          <label style={label}>Nombre completo</label>
          <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div style={fieldGroup}>
          <label style={label}>Email principal</label>
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div style={fieldGroup}>
          <label style={label}>Teléfono</label>
          <input style={input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" />
        </div>
        <div style={fieldGroup}>
          <label style={label}>Email alternativo</label>
          <input style={input} type="email" value={alternateEmail} onChange={(e) => setAlternateEmail(e.target.value)} />
        </div>
      </div>

      <div style={divider} />

      {/* Password */}
      <div style={sectionHeader}>
        <span style={sectionTitle}>Cambiar contraseña</span>
        <span style={sectionNote}>Dejá vacío para no cambiarla</span>
      </div>
      <div style={grid}>
        <div style={fieldGroup}>
          <label style={label}>Nueva contraseña</label>
          <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
        </div>
        <div style={fieldGroup}>
          <label style={label}>Confirmar contraseña</label>
          <input style={input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
        </div>
      </div>

      {error && <p style={errorMsg}>{error}</p>}
      {success && <p style={successMsg}>Perfil actualizado correctamente.</p>}

      <div style={actions}>
        <button type="submit" style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

/* ── Styles ── */
const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 720 };

const avatarSection: React.CSSProperties = { display: "flex", alignItems: "center", gap: "1.5rem" };
const avatarWrap: React.CSSProperties = { position: "relative", width: 96, height: 96, flexShrink: 0 };
const avatarImg: React.CSSProperties = { borderRadius: "50%", objectFit: "cover", width: 96, height: 96 };
const avatarFallback: React.CSSProperties = {
  width: 96, height: 96, borderRadius: "50%", background: "#1b4de0", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em",
};
const avatarOverlay: React.CSSProperties = {
  position: "absolute", bottom: 0, right: 0,
  width: 28, height: 28, borderRadius: "50%",
  background: "#111", color: "#fff", border: "2px solid #fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "0.75rem", cursor: "pointer", fontWeight: 700,
};
const avatarName: React.CSSProperties = { fontWeight: 700, fontSize: "1.1rem", margin: "0 0 0.2rem" };
const avatarRole: React.CSSProperties = { color: "#6b7280", fontSize: "0.82rem", margin: "0 0 0.6rem" };
const changePhotoBtn: React.CSSProperties = {
  padding: "0.35rem 0.85rem", background: "#fff", border: "1px solid #d1d5db",
  borderRadius: 7, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", marginRight: "0.5rem",
};
const removePhotoBtn: React.CSSProperties = {
  padding: "0.35rem 0.85rem", background: "none", border: "none",
  color: "#991b1b", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
};
const divider: React.CSSProperties = { borderTop: "1px solid #e5e7eb" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" };
const fieldGroup: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem" };
const label: React.CSSProperties = { fontSize: "0.82rem", fontWeight: 600, color: "#374151" };
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: "0.9rem", background: "#fff", outline: "none",
};
const sectionHeader: React.CSSProperties = { display: "flex", alignItems: "baseline", gap: "0.75rem" };
const sectionTitle: React.CSSProperties = { fontWeight: 700, fontSize: "0.95rem" };
const sectionNote: React.CSSProperties = { color: "#9ca3af", fontSize: "0.8rem" };
const errorMsg: React.CSSProperties = {
  background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8,
  padding: "0.65rem 1rem", color: "#991b1b", fontSize: "0.88rem", margin: 0,
};
const successMsg: React.CSSProperties = {
  background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8,
  padding: "0.65rem 1rem", color: "#166534", fontSize: "0.88rem", margin: 0,
};
const actions: React.CSSProperties = { display: "flex", justifyContent: "flex-end" };
const btnPrimary: React.CSSProperties = {
  padding: "0.65rem 1.75rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
};
