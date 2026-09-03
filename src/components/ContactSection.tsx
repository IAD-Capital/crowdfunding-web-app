"use client";

import { useState } from "react";
import ContactForm from "./ContactForm";
import DeveloperContactForm from "./DeveloperContactForm";

type Tab = "users" | "developers";

export default function ContactSection() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <section id="contacto" style={outerSection}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 640px) {
          .contact-form-row { grid-template-columns: 1fr !important; }
        }
      `,
        }}
      />
      <div style={inner}>
        <div style={header}>
          <div style={eyebrow}>Contacto</div>
          <h2 style={title}>Hablemos</h2>
          <p style={subtitle}>
            Contanos qué necesitás: si sos desarrolladora querés publicar una unidad, o si tenés
            alguna consulta general sobre cómo invertir.
          </p>
        </div>

        <div style={card}>
          <div style={tabsRow}>
            <button
              type="button"
              onClick={() => setTab("users")}
              style={{ ...tabBtn, ...(tab === "users" ? tabBtnActive : {}) }}
            >
              Consulta general
            </button>
            <button
              type="button"
              onClick={() => setTab("developers")}
              style={{ ...tabBtn, ...(tab === "developers" ? tabBtnActive : {}) }}
            >
              Soy desarrolladora
            </button>
          </div>

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

const outerSection: React.CSSProperties = {
  minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center",
  background: "var(--c-ink)",
  padding: "4rem 1.5rem",
};
const inner: React.CSSProperties = { maxWidth: 900, margin: "0 auto", width: "100%" };
const header: React.CSSProperties = { textAlign: "center", maxWidth: 560, margin: "0 auto 2.5rem" };
const eyebrow: React.CSSProperties = { fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", color: "#7fa0ff", textTransform: "uppercase", marginBottom: "0.7rem" };
const title: React.CSSProperties = { fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.025em", margin: "0 0 0.75rem", color: "#fff" };
const subtitle: React.CSSProperties = { fontSize: "0.95rem", color: "var(--c-text-on-dark)", margin: 0, lineHeight: 1.6 };

const card: React.CSSProperties = { background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 18, overflow: "hidden" };
const tabsRow: React.CSSProperties = { display: "flex", borderBottom: "1px solid var(--c-border)" };
const tabBtn: React.CSSProperties = {
  flex: 1, padding: "1rem", background: "transparent", border: "none", cursor: "pointer",
  fontSize: "0.92rem", fontWeight: 700, color: "var(--c-text-secondary)",
  borderBottom: "2px solid transparent", marginBottom: "-1px",
};
const tabBtnActive: React.CSSProperties = { color: "var(--c-ink)", borderBottom: "2px solid var(--c-accent)" };
const formWrap: React.CSSProperties = { padding: "1.75rem" };
