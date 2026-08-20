"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import s from "./Header.module.scss";

type NavDevelopment = { id: number; name: string; address: string; image: string | null; slug?: string | null };

export default function DevelopmentsMenu({
  developments, lang,
}: {
  developments: NavDevelopment[];
  lang: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function hide() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  if (developments.length === 0) return null;

  return (
    <div className={s.navItem} onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href={`/${lang}#catalog`}
        className={`${s.navLink} ${s.navTrigger}`}
        onFocus={show}
        onBlur={hide}
      >
        Emprendimientos
        <svg
          className={`${s.chevron} ${open ? s.chevronOpen : ""}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </Link>

      {mounted &&
        createPortal(
          <div
            className={`${s.megaMenu} ${open ? s.megaMenuOpen : ""}`}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className={s.megaMenuInner}>
              <div className={s.megaMenuGrid}>
                {developments.map((d) => (
                  <Link key={d.id} href={`/${lang}/developments/${d.slug ?? d.id}`} className={s.megaItem}>
                    <div className={s.megaItemImage}>
                      {d.image ? (
                        <Image src={d.image} alt={d.name} fill style={{ objectFit: "cover" }} className={s.megaItemImg} />
                      ) : (
                        <div className={s.megaItemPlaceholder} />
                      )}
                      <div className={s.megaItemOverlay} />
                    </div>
                    <div className={s.megaItemBody}>
                      <span className={s.megaItemName}>{d.name}</span>
                      <span className={s.megaItemAddr}>{d.address}</span>
                      <span className={s.megaItemCta}>
                        Ver emprendimiento
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href={`/${lang}#catalog`} className={s.megaFooterLink}>
                Ver todos los emprendimientos →
              </Link>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
