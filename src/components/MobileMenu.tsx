"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Menu, X, Wallet, UserRound, Settings, LogOut, LogIn, UserPlus,
} from "lucide-react";
import Link from "next/link";
import NotificationBell, { type Notification } from "./NotificationBell";
import MobileFeaturedCarousel, { type FeaturedProperty } from "./MobileFeaturedCarousel";
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
  featuredProperties: FeaturedProperty[];
  labels: { admin: string; signIn: string; signUp: string; logout: string };
};

export default function MobileMenu({ lang, session, notifications, featuredProperties, labels }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Close the drawer if the viewport is resized/rotated past the mobile
  // breakpoint (e.g. rotating a tablet, or resizing a desktop browser window)
  // — otherwise it stays open, hidden behind the now-visible desktop nav.
  useEffect(() => {
    if (!open) return;
    function onResize() {
      if (window.innerWidth > 768) setOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  function close() {
    setOpen(false);
  }

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.refresh();
  }

  const firstName = session?.fullName.trim().split(" ")[0] || session?.fullName;

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
          <div className={`${s.mobileMenuPanel} ${open ? s.mobileMenuPanelOpen : ""}`}>
            <div className={s.mobileMenuHeader}>
              <Link href={`/${lang}`} onClick={close} style={{ display: "inline-flex" }}>
                <Image src="/iad-logo.svg" alt="IAD Capital" width={449} height={226} className={s.logo} priority />
              </Link>
              <button className={s.mobileMenuCloseBtn} onClick={close} aria-label="Cerrar menú">
                <X size={20} />
              </button>
            </div>

            <div className={s.mobileMenuContent}>
              {session && (
                <div className={s.mobileUserRow}>
                  <span className={s.mobileUserAvatar}>{firstName?.charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <p className={s.mobileUserName}>{session.fullName}</p>
                    <p className={s.mobileUserEmail}>{session.email}</p>
                  </div>
                </div>
              )}

              {featuredProperties.length > 0 && (
                <div className={s.mobileMenuSection}>
                  <MobileFeaturedCarousel items={featuredProperties} lang={lang} onNavigate={close} />
                  <Link
                    href={`/${lang}#catalog`}
                    className={`${s.btnOutline} ${s.blockBtn}`}
                    style={{ marginTop: "0.75rem" }}
                    onClick={close}
                  >
                    Ver todas las propiedades
                  </Link>
                </div>
              )}

              <div className={s.mobileMenuSection}>
                <Link
                  href={`/${lang}/como-invertir`}
                  className={`${s.btnCta} ${s.blockBtn}`}
                  onClick={close}
                >
                  Quiero invertir
                </Link>
              </div>

              {session && (
                <div className={s.mobileMenuSection}>
                  {session.role !== "superadmin" && (
                    <>
                      <Link href={`/${lang}/wallet`} className={s.userMenuItem} onClick={close}>
                        <Wallet size={16} /> Mi cartera
                      </Link>
                      <Link href={`/${lang}/profile`} className={s.userMenuItem} onClick={close}>
                        <UserRound size={16} /> Mi perfil
                      </Link>
                    </>
                  )}
                  {session.role === "superadmin" && (
                    <Link href={`/${lang}/admin`} className={s.userMenuItem} onClick={close}>
                      <Settings size={16} /> {labels.admin}
                    </Link>
                  )}
                  {session.role === "investor" && (
                    <NotificationBell notifications={notifications} dark={false} fullWidth />
                  )}
                </div>
              )}

              <div className={s.mobileMenuSection}>
                <a
                  href="https://www.instagram.com/iadcapital"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.userMenuItem}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  Seguinos en Instagram
                </a>
              </div>

              {session ? (
                <div className={s.mobileMenuSection} style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                  <button
                    type="button"
                    className={`${s.userMenuItem} ${s.userMenuItemDanger}`}
                    onClick={logout}
                    disabled={loggingOut}
                  >
                    <LogOut size={16} /> {loggingOut ? "Cerrando…" : labels.logout}
                  </button>
                </div>
              ) : (
                <div className={s.mobileMenuSection} style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                  <Link href={`/${lang}/login`} className={s.userMenuItem} onClick={close}>
                    <LogIn size={16} /> {labels.signIn}
                  </Link>
                  <Link
                    href={`/${lang}/signup`}
                    className={`${s.btnOutline} ${s.blockBtn}`}
                    style={{ marginTop: "0.4rem", gap: "0.5rem" }}
                    onClick={close}
                  >
                    <UserPlus size={16} /> {labels.signUp}
                  </Link>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
