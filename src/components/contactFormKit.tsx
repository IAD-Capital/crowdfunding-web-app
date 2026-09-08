"use client";

import { CheckCircle2 } from "lucide-react";

// Shared floating-label styling for ContactForm and DeveloperContactForm.
// The label has to be a DOM sibling that follows the input for the
// `:not(:placeholder-shown) + .cf-label` CSS trick to work — that's why Field
// wraps both in a <label> (which also gives free click-to-focus a11y) instead
// of relying on htmlFor/id pairing.
export function FieldStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 640px) {
          .contact-form-row { grid-template-columns: 1fr !important; }
        }
        .cf-field { position: relative; }
        .cf-field::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
          background: linear-gradient(90deg, var(--c-accent), var(--c-positive));
          transform: scaleX(0); transform-origin: center;
          transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1);
        }
        .cf-field:focus-within::after { transform: scaleX(1); }
        .cf-input, .cf-textarea {
          width: 100%; background: transparent; border: none;
          border-bottom: 1.5px solid var(--c-border-input);
          padding: 1.4rem 0 0.55rem; font-size: 0.95rem; color: var(--c-ink);
          outline: none; font-family: inherit;
        }
        .cf-textarea { resize: vertical; line-height: 1.5; }
        .cf-label {
          position: absolute; left: 0; top: 1.4rem; font-size: 0.95rem;
          color: var(--c-text-tertiary); pointer-events: none; transform-origin: left top;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .cf-input:focus + .cf-label, .cf-input:not(:placeholder-shown) + .cf-label,
        .cf-textarea:focus + .cf-label, .cf-textarea:not(:placeholder-shown) + .cf-label {
          transform: translateY(-1.15rem) scale(0.78); color: var(--c-accent); font-weight: 700;
        }
        .cf-submit { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .cf-submit:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(27, 77, 224, 0.45);
        }
        .cf-submit:active:not(:disabled) { transform: translateY(0); }
        .cf-photo-add { transition: border-color 0.2s ease, background 0.2s ease; }
        .cf-photo-add:hover { border-color: var(--c-accent); background: var(--c-accent-light); }
        @keyframes cfSuccessPop {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        .cf-success { animation: cfSuccessPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
      `,
      }}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={fieldWrap} className="cf-field">
      {children}
      <span style={fieldLabel} className="cf-label">{label}</span>
    </label>
  );
}

export function SuccessBox({ message }: { message: string }) {
  return (
    <div style={successBox} className="cf-success">
      <div style={successIconCircle}>
        <CheckCircle2 size={22} />
      </div>
      <p style={successText}>{message}</p>
    </div>
  );
}

export const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "1.4rem" };
export const formTitle: React.CSSProperties = { fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "var(--c-ink)" };
export const formDesc: React.CSSProperties = { fontSize: "0.85rem", color: "var(--c-text-secondary)", margin: "-0.6rem 0 0", lineHeight: 1.5 };
export const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" };
const fieldWrap: React.CSSProperties = { position: "relative", display: "block", cursor: "text" };
const fieldLabel: React.CSSProperties = {};
export const errorStyle: React.CSSProperties = { fontSize: "0.82rem", color: "#dc2626", margin: 0 };
export const btnPrimary: React.CSSProperties = {
  padding: "0.85rem 1.75rem", background: "linear-gradient(135deg, var(--c-accent), var(--c-accent-dark))",
  color: "#fff", borderRadius: 999, fontWeight: 700, fontSize: "0.92rem", border: "none",
  cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: "0.5rem", alignSelf: "flex-start",
};
const successBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
  padding: "2rem 1.5rem", textAlign: "center",
};
const successIconCircle: React.CSSProperties = {
  width: 52, height: 52, borderRadius: "50%", background: "var(--c-positive-light)",
  color: "var(--c-positive)", display: "flex", alignItems: "center", justifyContent: "center",
};
const successText: React.CSSProperties = { color: "var(--c-ink)", fontWeight: 600, margin: 0, fontSize: "0.95rem", maxWidth: 320 };
