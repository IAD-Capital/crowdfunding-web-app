"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { trackCtaClick } from "@/lib/analytics";

type Props = {
  unitId: number;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  lang: string;
  label?: string;
  location?: string;
  variant?: "hero" | "card";
};

export default function FavoriteButton({
  unitId, initialFavorited, isAuthenticated, lang, label, location = "unknown", variant = "card",
}: Props) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const next = typeof window !== "undefined" ? window.location.pathname : undefined;
      router.push(`/${lang}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
      return;
    }

    if (pending) return;
    const next = !favorited;
    setPending(true);
    setFavorited(next); // optimistic
    trackCtaClick(next ? "favorite_add" : "favorite_remove", { label, location, unit_id: unitId });

    try {
      const res = await fetch(`/api/favorites/${unitId}`, { method: next ? "POST" : "DELETE" });
      if (!res.ok) throw new Error("request failed");
    } catch {
      setFavorited(!next); // revert on failure
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorited}
      style={variant === "hero" ? heroBtn : cardBtn}
    >
      <Heart
        size={variant === "hero" ? 18 : 15}
        fill={favorited ? "#ef4444" : "none"}
        color={favorited ? "#ef4444" : variant === "hero" ? "#fff" : "#374151"}
        strokeWidth={2}
      />
    </button>
  );
}

const heroBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: "50%",
  background: "rgba(17,17,17,0.55)", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", backdropFilter: "blur(2px)",
};

const cardBtn: React.CSSProperties = {
  position: "absolute", top: 10, right: 10, zIndex: 2,
  width: 30, height: 30, borderRadius: "50%",
  background: "rgba(255,255,255,0.92)", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
};
