"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

type Coords = { top: number; right: number } | { bottom: number; right: number };

export default function ActionsMenu({ actions, children }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onScrollOrResize() {
      setOpen(false);
    }
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  // Position the menu relative to the trigger, below it by default.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
  }, [open]);

  // Once the menu has actually rendered (so we know its real height), flip
  // it above the trigger if it would otherwise overflow the viewport bottom —
  // this is what let it get clipped by an ancestor's `overflow: hidden`.
  useLayoutEffect(() => {
    if (!open || !coords || !("top" in coords) || !menuRef.current || !triggerRef.current) return;
    const menuRect = menuRef.current.getBoundingClientRect();
    if (menuRect.bottom > window.innerHeight - 8) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      setCoords({ bottom: window.innerHeight - triggerRect.top + 4, right: window.innerWidth - triggerRect.right });
    }
  }, [open, coords]);

  if (actions.length === 0 && !children) return null;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={trigger}
        aria-label="Más acciones"
      >
        <MoreVertical size={16} />
      </button>

      {open && coords && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} style={{ ...menu, ...coords }}>
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
        </div>,
        document.body
      )}
    </div>
  );
}

const trigger: React.CSSProperties = {
  width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
  background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", color: "#6b7280",
};
const menu: React.CSSProperties = {
  position: "fixed", zIndex: 1000,
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
