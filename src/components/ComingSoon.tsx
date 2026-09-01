import Image from "next/image";
import ComingSoonCountdown from "./ComingSoonCountdown";
import TrackedLink from "./TrackedLink";
import type { Locale } from "@/i18n";

export default function ComingSoon({ expiresAt, lang }: { expiresAt: string; lang: Locale }) {
  return (
    <div style={wrap}>
      <div style={content}>
        <Image
          src="/iad-capital-logo.svg"
          alt="IAD Capital"
          width={220}
          height={158}
          style={logo}
          priority
        />
        <p style={tagline}>Somos el nuevo crowdfunding inmobiliario</p>
        <ComingSoonCountdown expiresAt={expiresAt} />
        <p style={message}>
          Falta muy poco para que puedas disfrutar de una nueva forma de invertir en bienes raíces.
        </p>
        <TrackedLink
          href={`/${lang}/signup`}
          style={ctaButton}
          ctaId="coming_soon_signup"
          ctaLabel="Regístrate para obtener las últimas novedades"
          ctaLocation="coming_soon"
        >
          Regístrate para obtener las últimas novedades
        </TrackedLink>
      </div>
    </div>
  );
}

const dropShadow = "0px 2px 2px rgba(0,0,0,0.25)";

const wrap: React.CSSProperties = {
  position: "relative", minHeight: "100vh", display: "flex",
  alignItems: "center", justifyContent: "center", overflow: "hidden",
  background: "#1F4458", padding: "2rem 1.5rem",
};
const content: React.CSSProperties = {
  position: "relative", zIndex: 1, display: "flex", flexDirection: "column",
  alignItems: "center", textAlign: "center", gap: "1.5rem", maxWidth: 620,
};
const logo: React.CSSProperties = {
  width: 240, height: "auto",
  filter: `brightness(0) invert(1) drop-shadow(${dropShadow})`,
};
const tagline: React.CSSProperties = {
  fontSize: "clamp(0.8rem, 0.68rem + 0.5vw, 1.05rem)", fontWeight: 600, color: "rgba(255,255,255,0.85)",
  textTransform: "uppercase", letterSpacing: "0.08em", margin: 0,
  textShadow: dropShadow,
};
const message: React.CSSProperties = {
  fontSize: "clamp(1.25rem, 2.4vw + 1rem, 1.75rem)", fontWeight: 500, color: "#fff",
  lineHeight: 1.4, margin: "0.5rem 0 0", letterSpacing: "-0.01em",
  textShadow: dropShadow,
};
const ctaButton: React.CSSProperties = {
  marginTop: "0.5rem",
  padding: "0.9rem 1.75rem",
  background: "#fff",
  color: "#1b4de0",
  borderRadius: 999,
  fontSize: "1rem",
  fontWeight: 700,
  textDecoration: "none",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};
