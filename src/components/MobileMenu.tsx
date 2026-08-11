"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import NotificationBell, { type Notification } from "./NotificationBell";
import type { Locale } from "@/i18n";
import s from "./Header.module.scss";

type Session = {
  sub: string;
  email: string;
  role: "superadmin" | "investor";
  fullName: string;
} | null;

type Props = {
  lang: Locale;
  session: Session;
  notifications: Notification[];
  labels: { admin: string; signIn: string; signUp: string; logout: string };
};

export default function MobileMenu({ lang, session, notifications, labels }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        className={s.hamburgerBtn}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mounted &&
        createPortal(
          <>
            {open && <div className={s.mobileMenuBackdrop} onClick={close} />}
            <div className={`${s.mobileMenuPanel} ${open ? s.mobileMenuPanelOpen : ""}`}>
              {session ? (
                <div className={s.mobileMenuSection}>
                  <span className={s.userLabel}>{session.fullName}</span>

                  {session.role !== "superadmin" && (
                    <Link href={`/${lang}/wallet`} className={s.navLink} onClick={close}>
                      Mi cartera
                    </Link>
                  )}
                  {session.role === "superadmin" && (
                    <Link href={`/${lang}/admin`} className={s.navLink} onClick={close}>
                      {labels.admin}
                    </Link>
                  )}
                  {session.role === "investor" && (
                    <NotificationBell notifications={notifications} dark={false} />
                  )}

                  <LogoutButton label={labels.logout} />
                </div>
              ) : (
                <div className={s.mobileMenuSection}>
                  <Link href={`/${lang}/login`} className={s.navLink} onClick={close}>
                    {labels.signIn}
                  </Link>
                  <Link href={`/${lang}/signup`} className={s.btnOutline} onClick={close}>
                    {labels.signUp}
                  </Link>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
