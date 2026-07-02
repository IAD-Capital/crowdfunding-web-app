"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "@/components/LogoutButton";

type Props = {
  lang: string;
  userEmail: string;
  userName: string;
  userAvatar?: string | null;
};

const CRUMBS: Record<string, string> = {
  admin: "Admin",
  developments: "Emprendimientos",
  units: "Departamentos",
  gallery: "Galería",
  developers: "Desarrolladoras",
  investments: "Inversiones",
  users: "Usuarios",
  settings: "Configuración",
  new: "Nuevo",
  edit: "Editar",
  import: "Importar CSV",
  profile: "Mi perfil",
};

function buildBreadcrumbs(pathname: string, lang: string) {
  const segments = pathname.split("/").filter(Boolean);
  // Remove lang prefix
  const rest = segments[0] === lang ? segments.slice(1) : segments;

  const crumbs: { label: string; href: string }[] = [];
  let path = `/${lang}`;
  for (const seg of rest) {
    path += `/${seg}`;
    const label = CRUMBS[seg] ?? (isNumeric(seg) ? "#" + seg : seg);
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

function isNumeric(s: string) { return /^\d+$/.test(s); }

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default function AdminTopbar({ lang, userEmail, userName, userAvatar }: Props) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname, lang);

  return (
    <header style={topbar}>
      {/* Breadcrumb */}
      <nav style={breadcrumb}>
        {crumbs.map((c, i) => (
          <span key={c.href} style={crumbWrap}>
            {i > 0 && <span style={crumbSep}>/</span>}
            {i === crumbs.length - 1 ? (
              <span style={crumbCurrent}>{c.label}</span>
            ) : (
              <Link href={c.href} style={crumbLink}>{c.label}</Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div style={right}>
        <Link href={`/${lang}`} target="_blank" style={visitBtn} title="Ver sitio web">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Web
        </Link>

        <div style={profileWrap}>
          {userAvatar ? (
            <Image src={userAvatar} alt={userName} width={34} height={34} style={{ ...avatar, objectFit: "cover" }} />
          ) : (
            <div style={avatar}>{initials(userName)}</div>
          )}
          <div style={profileInfo}>
            <span style={profileName}>{userName}</span>
            <span style={profileEmail}>{userEmail}</span>
          </div>
        </div>

        <LogoutButton label="Salir" />
      </div>
    </header>
  );
}

const topbar: React.CSSProperties = {
  height: 60,
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 1.5rem",
  position: "sticky",
  top: 0,
  zIndex: 30,
};

const breadcrumb: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.15rem",
  fontSize: "0.85rem",
};

const visitBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.4rem",
  padding: "0.4rem 0.85rem",
  border: "1px solid #e5e7eb", borderRadius: 8,
  background: "#fff", color: "#374151",
  fontSize: "0.82rem", fontWeight: 600,
  textDecoration: "none",
  transition: "border-color 0.12s, color 0.12s",
};

const crumbWrap: React.CSSProperties = { display: "flex", alignItems: "center", gap: "0.15rem" };
const crumbSep: React.CSSProperties = { color: "#d1d5db", margin: "0 0.15rem" };
const crumbLink: React.CSSProperties = { color: "#6b7280", textDecoration: "none", fontWeight: 500 };
const crumbCurrent: React.CSSProperties = { color: "#111", fontWeight: 600 };

const right: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
};

const profileWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
};

const avatar: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "#1b4de0",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.75rem",
  fontWeight: 800,
  flexShrink: 0,
  letterSpacing: "0.02em",
};

const profileInfo: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  lineHeight: 1.2,
};

const profileName: React.CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "#111",
  whiteSpace: "nowrap",
};

const profileEmail: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "#9ca3af",
  whiteSpace: "nowrap",
};
