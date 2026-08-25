"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, Home, Images, Users, TrendingUp, Settings,
  ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen,
  Plus, List, GitFork, Star, MessageCircle, Bell,
} from "lucide-react";
import NotificationBell, { type Notification } from "@/components/NotificationBell";
import { useMobileSidebar } from "./MobileSidebarContext";

type SubItem = { label: string; href: string; icon?: React.ReactNode };
type NavItem = { key: string; label: string; icon: React.ReactNode; items: SubItem[]; direct?: boolean };
type Props = { lang: string; notifications: Notification[] };

const ICON = 20;
const SUB_ICON = 15;

export default function AdminSidebar({ lang, notifications }: Props) {
  const pathname = usePathname();
  const { open: mobileOpen, setOpen: setMobileOpen } = useMobileSidebar();
  const [collapsed, setCollapsed] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["developments"]));
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const isExpanded = !collapsed || hoverExpanded || mobileOpen;

  // Close the mobile drawer whenever the route changes (link clicked / back button)
  useEffect(() => {
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    setHoverExpanded(false);
    document.documentElement.style.setProperty("--sidebar-w", next ? "68px" : "240px");
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const nav: NavItem[] = [
    {
      key: "developments",
      label: "Emprendimientos",
      icon: <Building2 size={ICON} />,
      items: [
        { label: "Crear nuevo", href: `/${lang}/admin/developments/new`, icon: <Plus size={SUB_ICON} /> },
        { label: "Ver todos", href: `/${lang}/admin/developments`, icon: <List size={SUB_ICON} /> },
      ],
    },
    {
      key: "units",
      label: "Departamentos",
      icon: <Home size={ICON} />,
      items: [
        { label: "Ver todos", href: `/${lang}/admin/units`, icon: <List size={SUB_ICON} /> },
        { label: "Destacadas", href: `/${lang}/admin/units/featured`, icon: <Star size={SUB_ICON} /> },
      ],
    },
    {
      key: "gallery",
      label: "Galería",
      icon: <Images size={ICON} />,
      direct: true,
      items: [
        { label: "Ver galería", href: `/${lang}/admin/gallery`, icon: <List size={SUB_ICON} /> },
      ],
    },
    {
      key: "developers",
      label: "Desarrolladoras",
      icon: <GitFork size={ICON} />,
      items: [
        { label: "Crear nueva", href: `/${lang}/admin/developers/new`, icon: <Plus size={SUB_ICON} /> },
        { label: "Ver todas", href: `/${lang}/admin/developers`, icon: <List size={SUB_ICON} /> },
      ],
    },
    {
      key: "chatbot",
      label: "Chatbot",
      icon: <MessageCircle size={ICON} />,
      items: [
        { label: "Crear nueva", href: `/${lang}/admin/chatbot/new`, icon: <Plus size={SUB_ICON} /> },
        { label: "Ver todas", href: `/${lang}/admin/chatbot`, icon: <List size={SUB_ICON} /> },
        { label: "Sin responder", href: `/${lang}/admin/chatbot/unanswered`, icon: <List size={SUB_ICON} /> },
      ],
    },
    {
      key: "investments",
      label: "Inversiones",
      icon: <TrendingUp size={ICON} />,
      direct: true,
      items: [
        { label: "Ver inversiones", href: `/${lang}/admin/investments`, icon: <List size={SUB_ICON} /> },
      ],
    },
    {
      key: "notifications",
      label: "Notificaciones",
      icon: <Bell size={ICON} />,
      direct: true,
      items: [
        { label: "Enviar notificación", href: `/${lang}/admin/notifications`, icon: <Bell size={SUB_ICON} /> },
      ],
    },
    {
      key: "users",
      label: "Usuarios",
      icon: <Users size={ICON} />,
      items: [
        { label: "Crear nuevo", href: `/${lang}/admin/users/new`, icon: <Plus size={SUB_ICON} /> },
        { label: "Ver todos", href: `/${lang}/admin/users`, icon: <List size={SUB_ICON} /> },
      ],
    },
    {
      key: "settings",
      label: "Configuración",
      icon: <Settings size={ICON} />,
      items: [
        { label: "Parámetros", href: `/${lang}/admin/settings`, icon: <Settings size={SUB_ICON} /> },
        { label: "Mi perfil", href: `/${lang}/admin/settings/profile`, icon: <Users size={SUB_ICON} /> },
      ],
    },
  ];

  return (
    <>
      <style>{`
        .sidebar-section-btn:hover { background: #f3f6ff !important; color: #1b4de0 !important; }
        .sidebar-sub-item:hover { background: #f3f6ff !important; color: #1b4de0 !important; }
        .sidebar-toggle:hover { background: #f3f4f6 !important; color: #111 !important; }
        @media (max-width: 768px) {
          .admin-sidebar {
            width: 240px !important;
            transform: translateX(-100%);
            box-shadow: none;
          }
          .admin-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 24px rgba(0,0,0,0.18);
          }
          .admin-sidebar-toggle-row { display: none !important; }
        }
      `}</style>

      {/* Backdrop — only ever rendered while the mobile drawer is open */}
      {mobileOpen && (
        <div style={backdrop} onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      <aside
        className={`admin-sidebar${mobileOpen ? " mobile-open" : ""}`}
        style={{ ...sidebar, width: isExpanded ? 240 : 68 }}
        onMouseEnter={() => collapsed && setHoverExpanded(true)}
        onMouseLeave={() => setHoverExpanded(false)}
      >
        {/* Logo */}
        <div style={logoRow}>
          <Link href={`/${lang}/admin`} style={logoLink}>
            <span style={logoText}>IAD Capital</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={navWrap}>
          {nav.map((item) => {
            const isOpen = openSections.has(item.key);
            const isActive = item.items.some((s) => pathname.startsWith(s.href.split("?")[0]));
            const directHref = item.direct ? item.items[0].href : null;

            return (
              <div key={item.key}>
                {directHref ? (
                  <Link
                    href={directHref}
                    className="sidebar-section-btn"
                    style={{
                      ...sectionBtn,
                      ...(isActive || hoveredSection === item.key ? sectionBtnActive : {}),
                      justifyContent: isExpanded ? "flex-start" : "center",
                      textDecoration: "none",
                    }}
                    title={collapsed ? item.label : undefined}
                    onMouseEnter={() => setHoveredSection(item.key)}
                    onMouseLeave={() => setHoveredSection(null)}
                  >
                    <span style={{ ...sectionIcon, color: isActive || hoveredSection === item.key ? "#1b4de0" : "inherit" }}>
                      {item.icon}
                    </span>
                    {isExpanded && <span style={sectionLabel}>{item.label}</span>}
                  </Link>
                ) : (
                  <button
                    className="sidebar-section-btn"
                    style={{
                      ...sectionBtn,
                      ...((isActive && !hovered?.startsWith(item.key + "-")) || hoveredSection === item.key ? sectionBtnActive : {}),
                      justifyContent: isExpanded ? "flex-start" : "center",
                    }}
                    onClick={() => isExpanded && toggleSection(item.key)}
                    onMouseEnter={() => { setHoveredSection(item.key); if (isExpanded) { setOpenSections((prev) => { const next = new Set(prev); next.add(item.key); return next; }); } }}
                    onMouseLeave={() => setHoveredSection(null)}
                    title={collapsed ? item.label : undefined}
                  >
                    <span style={{ ...sectionIcon, color: isActive || hoveredSection === item.key ? "#1b4de0" : "inherit" }}>
                      {item.icon}
                    </span>
                    {isExpanded && (
                      <>
                        <span style={sectionLabel}>{item.label}</span>
                        <span style={chevron}>
                          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {!item.direct && isExpanded && isOpen && (
                  <div style={subList}>
                    {item.items.map((sub) => {
                      const subActive = pathname === sub.href.split("?")[0];
                      const subKey = item.key + "-" + sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="sidebar-sub-item"
                          style={{
                            ...subItem,
                            ...(subActive ? subItemActive : {}),
                          }}
                          onMouseEnter={() => setHovered(subKey)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <span style={{ ...subIcon, color: subActive ? "#1b4de0" : "#9ca3af" }}>
                            {sub.icon}
                          </span>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Notifications */}
        <div style={notifRow}>
          <NotificationBell notifications={notifications} sidebarExpanded={isExpanded} />
        </div>

        {/* Toggle button — bottom (desktop only; the mobile drawer closes via the backdrop) */}
        <div style={toggleRow} className="admin-sidebar-toggle-row">
          <button className="sidebar-toggle" style={toggleBtn} onClick={toggle} title={collapsed ? "Expandir menú" : "Colapsar menú"}>
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            {isExpanded && <span style={toggleLabel}>Colapsar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Styles ──────────────────────────── */

const sidebar: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  background: "#fff",
  borderRight: "1px solid #e5e7eb",
  display: "flex",
  flexDirection: "column",
  zIndex: 50,
  transition: "width 0.2s ease, transform 0.25s ease",
  overflowY: "auto",
  overflowX: "hidden",
};

const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  zIndex: 45,
};

const logoRow: React.CSSProperties = {
  height: 60,
  display: "flex",
  alignItems: "center",
  padding: "0 1rem",
  borderBottom: "1px solid #e5e7eb",
  flexShrink: 0,
};

const logoLink: React.CSSProperties = { textDecoration: "none", overflow: "hidden" };
const logoText: React.CSSProperties = {
  fontWeight: 800,
  fontSize: "1.1rem",
  color: "#111",
  letterSpacing: "-0.03em",
  whiteSpace: "nowrap",
};

const navWrap: React.CSSProperties = {
  flex: 1,
  paddingTop: "0.75rem",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
};

const sectionBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "0.7rem",
  padding: "0.6rem 0.9rem",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#374151",
  fontSize: "0.875rem",
  fontWeight: 600,
  textAlign: "left",
  transition: "background 0.12s, color 0.12s",
};

const sectionBtnActive: React.CSSProperties = {
  color: "#1b4de0",
  background: "#eff3ff",
};

const sectionIcon: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
};

const sectionLabel: React.CSSProperties = {
  flex: 1,
  whiteSpace: "nowrap",
  overflow: "hidden",
};

const chevron: React.CSSProperties = {
  flexShrink: 0,
  color: "#9ca3af",
  display: "flex",
  alignItems: "center",
};

const subList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  paddingLeft: "2.5rem",
  paddingBottom: "0.35rem",
};

const subItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.42rem 0.75rem",
  fontSize: "0.82rem",
  color: "#6b7280",
  fontWeight: 500,
  textDecoration: "none",
  borderRadius: 7,
  transition: "background 0.12s, color 0.12s",
};

const subItemActive: React.CSSProperties = {
  color: "#1b4de0",
  background: "#eff3ff",
  fontWeight: 600,
};

const subIcon: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
};

const notifRow: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  padding: "0.4rem 0.5rem",
  flexShrink: 0,
};

const toggleRow: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  padding: "0.75rem 0.5rem",
  flexShrink: 0,
};

const toggleBtn: React.CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  padding: "0.55rem 0.75rem",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#6b7280",
  borderRadius: 8,
  fontSize: "0.82rem",
  fontWeight: 500,
  transition: "background 0.12s, color 0.12s",
};

const toggleLabel: React.CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
};
