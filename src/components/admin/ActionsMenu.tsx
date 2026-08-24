"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical } from "lucide-react";

export type MenuAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "danger";
  disabled?: boolean;
};

type Props = { actions: MenuAction[]; children?: React.ReactNode };

export default function ActionsMenu({ actions, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (actions.length === 0 && !children) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={trigger}
        aria-label="Más acciones"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div style={menu}>
          {actions.map((a) => {
            const itemStyle = { ...item, ...(a.variant === "danger" ? itemDanger : {}), ...(a.disabled ? itemDisabled : {}) };
            const handleClick = () => {
              if (a.disabled) return;
              setOpen(false);
              a.onClick?.();
            };
            return a.href ? (
              <Link key={a.label} href={a.href} style={itemStyle} onClick={handleClick}>
                {a.label}
              </Link>
            ) : (
              <button key={a.label} type="button" style={itemStyle} onClick={handleClick} disabled={a.disabled}>
                {a.label}
              </button>
            );
          })}
          {children}
        </div>
      )}
    </div>
  );
}

const trigger: React.CSSProperties = {
  width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", color: "#6b7280",
};
const menu: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
  background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: 140,
  display: "flex", flexDirection: "column",
};
const item: React.CSSProperties = {
  display: "block", width: "100%", textAlign: "left", padding: "0.55rem 0.85rem",
  background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
  color: "#374151", textDecoration: "none", whiteSpace: "nowrap",
};
const itemDanger: React.CSSProperties = { color: "#dc2626" };
const itemDisabled: React.CSSProperties = { opacity: 0.5, cursor: "not-allowed" };
