"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import type { FeaturedProperty } from "./MobileFeaturedCarousel";
import s from "./Header.module.scss";

const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

export default function DevelopmentsMenu({
  properties, lang,
}: {
  properties: FeaturedProperty[];
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

  if (properties.length === 0) return null;

  return (
    <div className={s.navItem} onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href={`/${lang}#catalog`}
        className={`${s.navLink} ${s.navTrigger}`}
        onFocus={show}
        onBlur={hide}
      >
        Propiedades
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
                {properties.map((p) => (
                  <Link
                    key={p.id}
                    href={`/${lang}/developments/${p.development_slug ?? p.development_id}/units/${p.id}`}
                    className={s.megaItem}
                  >
                    <div className={s.megaItemImage}>
                      {p.image ? (
                        <Image src={p.image} alt={p.development_name} fill style={{ objectFit: "cover" }} className={s.megaItemImg} sizes="(max-width: 640px) 90vw, 240px" />
                      ) : (
                        <div className={s.megaItemPlaceholder} />
                      )}
                      <div className={s.megaItemOverlay} />
                    </div>
                    <div className={s.megaItemBody}>
                      <span className={s.megaItemName}>{p.development_name}</span>
                      <span className={s.megaItemAddr}>{p.development_address}</span>
                      <span className={s.megaItemPrice}>Desde {fmtUsd(p.price_usd)}</span>
                      <span className={s.megaItemCta}>
                        Ver propiedad
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
                Ver todas las propiedades →
              </Link>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
