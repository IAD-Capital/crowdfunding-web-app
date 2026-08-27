"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import s from "./Header.module.scss";

export type FeaturedProperty = {
  id: number;
  image: string | null;
  price_usd: number;
  development_name: string;
  development_address: string;
  development_slug: string | null;
  development_id: number;
};

type Props = { items: FeaturedProperty[]; lang: string; onNavigate: () => void };

const fmtUsd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;

export default function MobileFeaturedCarousel({ items, lang, onNavigate }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const rafRef = useRef<number | null>(null);

  function handleScroll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = trackRef.current;
      if (!el) return;
      const cards = Array.from(el.children) as HTMLElement[];
      if (cards.length === 0) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setActive(closest);
    });
  }

  if (items.length === 0) return null;

  return (
    <div>
      <div ref={trackRef} className={s.carouselTrack} onScroll={handleScroll}>
        {items.map((it, i) => (
          <Link
            key={it.id}
            href={`/${lang}/developments/${it.development_slug ?? it.development_id}/units/${it.id}`}
            onClick={onNavigate}
            className={s.carouselCard}
            style={{
              transform: `scale(${i === active ? 1 : 0.87})`,
              opacity: i === active ? 1 : 0.55,
            }}
          >
            <div className={s.carouselImageWrap}>
              {it.image ? (
                <Image
                  src={it.image}
                  alt={it.development_name}
                  fill
                  sizes="200px"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className={s.carouselImagePlaceholder} />
              )}
            </div>
            <div className={s.carouselCardBody}>
              <p className={s.carouselCardName}>{it.development_name}</p>
              <p className={s.carouselCardAddr}>
                <MapPin size={11} /> {it.development_address}
              </p>
              <p className={s.carouselCardPrice}>Desde {fmtUsd(it.price_usd)}</p>
            </div>
          </Link>
        ))}
      </div>

      {items.length > 1 && (
        <div className={s.carouselDots}>
          {items.map((it, i) => (
            <span key={it.id} className={`${s.carouselDot} ${i === active ? s.carouselDotActive : ""}`} />
          ))}
        </div>
      )}
    </div>
  );
}
