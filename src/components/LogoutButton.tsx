"use client";

export default function LogoutButton({ label, lang }: { label?: string; lang: string }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // A full document navigation (not router.push) so the request carries the
    // just-cleared auth cookie — a client-side soft nav can render before it lands.
    window.location.href = `/${lang}/login`;
  }

  return (
    <button
      onClick={logout}
      title="Cerrar sesión"
      style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "0.4rem",
        color: "#6b7280", padding: "6px", borderRadius: 8,
        transition: "color 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      {label && <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{label}</span>}
    </button>
  );
}
