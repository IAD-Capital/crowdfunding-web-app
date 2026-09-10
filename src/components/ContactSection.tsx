"use client";

import { useState } from "react";
import ContactForm from "./ContactForm";
import DeveloperContactForm from "./DeveloperContactForm";
import SegmentedToggle from "./SegmentedToggle";

type Tab = "users" | "developers";

export default function ContactSection() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <section id="contacto" style={section} className="contact-section">
      <style>{`
        @media (max-width: 760px) {
          .contact-section {
            position: sticky;
            top: 14px;
            z-index: 2;
            padding: 0 0 2rem !important;
          }
          .contact-cta-inner {
            grid-template-columns: 1fr !important;
            padding: 1.5rem !important;
            gap: 1.75rem !important;
            max-width: 100% !important;
            margin: 0 !important;
            border-radius: 22px 22px 0 0 !important;
            box-shadow: 0 -18px 40px rgba(0,0,0,0.35) !important;
          }
          .contact-cta-form-card { padding: 1.5rem !important; }
        }
      `}</style>
      <div style={inner} className="contact-cta-inner">
        {/* Left — copy */}
        <div style={copy}>
          <span style={eyebrow}>Contacto</span>
          <h2 style={headline}>Estamos para ayudarte</h2>
          <p style={sub}>
            Contanos qué necesitás: si sos desarrolladora querés publicar una unidad, o si tenés
            alguna consulta general sobre cómo invertir.
          </p>
          <ul style={perks}>
            {[
              "Respuesta rápida a tu consulta",
              "Sin compromiso, solo resolvemos tus dudas",
              "Para inversores y desarrolladoras",
            ].map((p) => (
              <li key={p} style={perk}>
                <span style={checkmark}>✓</span> {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div style={formCard} className="contact-cta-form-card">
          <SegmentedToggle
            options={[
              { value: "users", label: "Consulta general" },
              { value: "developers", label: "Soy desarrolladora" },
            ]}
            value={tab}
            onChange={setTab}
          />

          <div style={formWrap}>
            {tab === "users" ? (
              <ContactForm
                title="Contanos en qué te podemos ayudar"
                description="Te vamos a responder por email a la brevedad."
              />
            ) : (
              <DeveloperContactForm />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const section: React.CSSProperties = {
  background: "var(--c-bg)",
  padding: "1.5rem 1.5rem 4rem",
};
const inner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  background: "rgb(14, 23, 38)",
  borderRadius: 26,
  padding: "3.5rem",
  display: "grid",
  gridTemplateColumns: "1.1fr .9fr",
  gap: "3.5rem",
  alignItems: "center",
  boxShadow: "0 40px 80px -40px rgba(14,23,38,0.6)",
};
const copy: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.1rem" };
const eyebrow: React.CSSProperties = {
  fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "#bcd0ff",
};
const headline: React.CSSProperties = {
  fontSize: "clamp(1.75rem, 3.5vw, 2.4rem)", fontWeight: 800,
  lineHeight: 1.1, letterSpacing: "-0.03em", margin: 0, color: "#fff",
};
const sub: React.CSSProperties = { color: "#d6e0ff", lineHeight: 1.6, fontSize: "1rem", margin: 0, maxWidth: 440 };
const perks: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" };
const perk: React.CSSProperties = { display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.92rem", color: "#fff" };
const checkmark: React.CSSProperties = {
  width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.18)",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  color: "#fff", fontWeight: 800, fontSize: "0.7rem", flexShrink: 0,
};

const formCard: React.CSSProperties = {
  background: "var(--c-surface)", borderRadius: 18, padding: "2rem",
  display: "flex", flexDirection: "column", gap: "1.25rem",
};
const formWrap: React.CSSProperties = {};
