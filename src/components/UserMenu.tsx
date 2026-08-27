"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Wallet, UserRound, Settings, LogOut } from "lucide-react";
import s from "./Header.module.scss";

type Session = {
  sub: string;
  email: string;
  role: "superadmin" | "investor";
  fullName: string;
};

type Props = {
  lang: string;
  session: Session;
  adminLabel: string;
  logoutLabel: string;
};

export default function UserMenu({ lang, session, adminLabel, logoutLabel }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${lang}`);
    router.refresh();
  }

  const firstName = session.fullName.trim().split(" ")[0] || session.fullName;

  return (
    <div ref={wrapRef} className={s.userMenu}>
      <button
        type="button"
        className={s.userMenuTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={s.userAvatar}>{firstName.charAt(0).toUpperCase()}</span>
        <span className={s.userMenuName}>{firstName}</span>
        <ChevronDown size={14} className={`${s.chevron} ${open ? s.chevronOpen : ""}`} />
      </button>

      <div className={`${s.userMenuPanel} ${open ? s.userMenuPanelOpen : ""}`}>
        {session.role !== "superadmin" && (
          <>
            <Link href={`/${lang}/wallet`} className={s.userMenuItem} onClick={() => setOpen(false)}>
              <Wallet size={16} /> Mi cartera
            </Link>
            <Link href={`/${lang}/profile`} className={s.userMenuItem} onClick={() => setOpen(false)}>
              <UserRound size={16} /> Mi perfil
            </Link>
          </>
        )}
        {session.role === "superadmin" && (
          <Link href={`/${lang}/admin`} className={s.userMenuItem} onClick={() => setOpen(false)}>
            <Settings size={16} /> {adminLabel}
          </Link>
        )}
        <button
          type="button"
          className={`${s.userMenuItem} ${s.userMenuItemDanger}`}
          onClick={logout}
          disabled={loggingOut}
        >
          <LogOut size={16} /> {loggingOut ? "Cerrando…" : logoutLabel}
        </button>
      </div>
    </div>
  );
}
