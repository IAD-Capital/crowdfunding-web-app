"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Wallet, Heart, UserRound, Settings, LogOut, Download, Bell, Share, SquarePlus } from "lucide-react";
import { useInstallPrompt } from "./InstallPromptProvider";
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
  const [showIosHint, setShowIosHint] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const {
    ready, canInstall, isIosInstallable, notificationsAvailable, subscribing, requestInstall, requestNotifications,
  } = useInstallPrompt();

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

  function handleInstallClick() {
    if (canInstall) {
      requestInstall();
      setOpen(false);
    } else {
      setShowIosHint((v) => !v);
    }
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
            <Link href={`/${lang}/favorites`} className={s.userMenuItem} onClick={() => setOpen(false)}>
              <Heart size={16} /> Mis favoritos
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
        {ready && (canInstall || isIosInstallable) && (
          <button type="button" className={s.userMenuItem} onClick={handleInstallClick}>
            <Download size={16} /> Instalar app
          </button>
        )}
        {showIosHint && isIosInstallable && !canInstall && (
          <p className={s.userMenuHint}>
            Tocá <Share size={13} className={s.userMenuHintIcon} /> y luego &quot;Agregar a inicio&quot;{" "}
            <SquarePlus size={13} className={s.userMenuHintIcon} />.
          </p>
        )}
        {ready && notificationsAvailable && (
          <button type="button" className={s.userMenuItem} onClick={requestNotifications} disabled={subscribing}>
            <Bell size={16} /> {subscribing ? "Activando…" : "Activar notificaciones"}
          </button>
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
