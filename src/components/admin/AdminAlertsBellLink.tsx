import Link from "next/link";
import { Bell } from "lucide-react";

type Props = { lang: string; count: number; sidebarExpanded?: boolean };

export default function AdminAlertsBellLink({ lang, count, sidebarExpanded }: Props) {
  const inSidebar = sidebarExpanded !== undefined;

  return (
    <Link
      href={`/${lang}/admin/alerts`}
      className="sidebar-section-btn"
      style={{
        position: "relative",
        textDecoration: "none",
        padding: "0.55rem 0.75rem",
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        gap: inSidebar ? "0.7rem" : 0,
        justifyContent: sidebarExpanded ? "flex-start" : "center",
        width: inSidebar ? "100%" : "auto",
        color: "#6b7280",
      }}
      aria-label="Alertas"
    >
      <span style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Bell size={20} />
        {count > 0 && (
          <span style={{
            position: "absolute", top: -3, right: -5,
            minWidth: 15, height: 15, borderRadius: 999,
            background: "#ef4444", color: "#fff",
            fontSize: "0.58rem", fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", lineHeight: 1,
            border: "2px solid #fff",
          }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      {sidebarExpanded && (
        <span style={{ fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden" }}>
          Alertas{count > 0 ? ` (${count})` : ""}
        </span>
      )}
    </Link>
  );
}
