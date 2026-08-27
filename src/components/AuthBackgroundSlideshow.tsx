"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AuthBackgroundImage } from "@/lib/authBackgroundImages";

type Props = { images: AuthBackgroundImage[] };

export default function AuthBackgroundSlideshow({ images }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 5000);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div style={wrap}>
      {images.map((img, i) => (
        <Image
          key={img.url}
          src={img.url}
          alt={img.alt}
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          priority={i === 0}
          style={{
            objectFit: "cover",
            opacity: i === active ? 1 : 0,
            transition: "opacity 1.6s ease",
          }}
        />
      ))}
    </div>
  );
}

const wrap: React.CSSProperties = { position: "absolute", inset: 0 };
