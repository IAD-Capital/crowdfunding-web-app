"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PASSWORD_RULES } from "@/lib/password";
import PasswordInput from "@/components/PasswordInput";

type Mode = "create" | "edit";

type Props = {
  lang: string;
  mode: Mode;
  userId?: number;
  initial?: {
    full_name: string;
    email: string;
    role: string;
    avatar?: string | null;
    phone?: string | null;
    alternate_email?: string | null;
  };
};

const ROLES = [
  { value: "superadmin", label: "Superadmin" },
  { value: "investor", label: "Investor" },
];

const PASSWORD_CHECKS = [
  { label: "Al menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Minúscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Número", test: (p: string) => /\d/.test(p) },
  { label: "Carácter especial", test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function UserForm({ lang, mode, userId, initial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [alternateEmail, setAlternateEmail] = useState(initial?.alternate_email ?? "");
  const [role, setRole] = useState(initial?.role ?? "investor");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordOk = mode === "edit" ? (!password || PASSWORD_RULES.test(password)) : PASSWORD_RULES.test(password);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.path) setAvatar(data.path);
    else setError(data.error ?? "Error al subir imagen.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "create" && !PASSWORD_RULES.test(password)) {
      setError("La contraseña no cumple los requisitos.");
      return;
    }
    if (mode === "edit" && password && !PASSWORD_RULES.test(password)) {
      setError("La contraseña no cumple los requisitos.");
      return;
    }

    setSaving(true);
    const url = mode === "create" ? "/api/admin/users" : `/api/admin/users/${userId}`;
    const method = mode === "create" ? "POST" : "PUT";

    const body: Record<string, unknown> = {
      full_name: fullName, email, role, avatar,
      phone: phone.trim() || null,
      alternate_email: alternateEmail.trim() || null,
    };
    if (mode === "create" || password) body.password = password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
    router.push(`/${lang}/admin/users`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={form}>
      {error && <p style={errorBox}>{error}</p>}

      {/* Avatar */}
      <div style={avatarSection}>
        <div style={avatarWrap} onClick={() => fileRef.current?.click()}>
          {avatar ? (
            <Image src={avatar} alt="Avatar" fill style={{ objectFit: "cover", borderRadius: "50%" }} />
          ) : (
            <div style={avatarPlaceholder} />
          )}
          <div style={avatarOverlay}>
            <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 600 }}>
              {uploading ? "Subiendo…" : "Cambiar"}
            </span>
          </div>
        </div>
        {avatar && (
          <button type="button" style={removeAvatar} onClick={() => setAvatar(null)}>
            Quitar foto
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
          disabled={uploading}
        />
      </div>

      {/* Name */}
      <label style={label}>
        Nombre completo
        <input
          style={input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Juan García"
        />
      </label>

      {/* Email */}
      <label style={label}>
        Email
        <input
          style={input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="juan@ejemplo.com"
        />
      </label>

      {/* Phone */}
      <label style={label}>
        Teléfono celular
        <input
          style={input}
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+54 9 11 1234-5678"
        />
      </label>

      {/* Alternate email */}
      <label style={label}>
        Email alternativo
        <input
          style={input}
          type="email"
          value={alternateEmail}
          onChange={(e) => setAlternateEmail(e.target.value)}
          placeholder="juan.alt@ejemplo.com"
        />
      </label>

      {/* Role */}
      <label style={label}>
        Rol
        <select style={input} value={role} onChange={(e) => setRole(e.target.value)} required>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </label>

      {/* Password */}
      <label style={label}>
        {mode === "create" ? "Contraseña" : "Nueva contraseña (dejar vacío para no cambiar)"}
        <PasswordInput
          style={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={mode === "create"}
          placeholder={mode === "edit" ? "••••••••" : ""}
          autoComplete="new-password"
        />
      </label>

      {/* Password checklist */}
      {(mode === "create" || password) && (
        <ul style={checklist}>
          {PASSWORD_CHECKS.map((c) => {
            const ok = c.test(password);
            return (
              <li key={c.label} style={{ ...checkItem, color: ok ? "#16a34a" : "#9ca3af" }}>
                <span style={{ marginRight: "0.4rem" }}>{ok ? "✓" : "○"}</span>
                {c.label}
              </li>
            );
          })}
        </ul>
      )}

      {/* Actions */}
      <div style={actions}>
        <button
          type="button"
          style={btnSecondary}
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          type="submit"
          style={{ ...btnPrimary, opacity: saving || !passwordOk ? 0.6 : 1 }}
          disabled={saving || !passwordOk}
        >
          {saving ? "Guardando…" : mode === "create" ? "Crear usuario" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

const form: React.CSSProperties = {
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
  padding: "2rem", width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem",
};
const errorBox: React.CSSProperties = {
  background: "#fee2e2", color: "#991b1b", borderRadius: 8,
  padding: "0.75rem 1rem", fontSize: "0.875rem",
};
const avatarSection: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" };
const avatarWrap: React.CSSProperties = {
  position: "relative", width: 96, height: 96, borderRadius: "50%",
  overflow: "hidden", border: "2px solid #e5e7eb", cursor: "pointer",
  background: "#f9fafb",
};
const avatarPlaceholder: React.CSSProperties = {
  width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
};
const avatarOverlay: React.CSSProperties = {
  position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
const removeAvatar: React.CSSProperties = {
  background: "none", border: "none", color: "#ef4444",
  fontSize: "0.78rem", cursor: "pointer", padding: 0,
};
const label: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.875rem", fontWeight: 600 };
const input: React.CSSProperties = {
  padding: "0.55rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8,
  fontSize: "0.9rem", outline: "none", fontWeight: 400,
};
const checklist: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "0.25rem 1rem" };
const checkItem: React.CSSProperties = { fontSize: "0.78rem", display: "flex", alignItems: "center" };
const actions: React.CSSProperties = { display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" };
const btnPrimary: React.CSSProperties = {
  padding: "0.55rem 1.25rem", background: "#111", color: "#fff",
  border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "0.55rem 1.25rem", background: "#fff", color: "#111",
  border: "1px solid #d1d5db", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
};
