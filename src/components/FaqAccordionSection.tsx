"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type PublicFaq = { id: number; question: string; answer: string };

type Props = { faqs: PublicFaq[] };

export default function FaqAccordionSection({ faqs }: Props) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  if (faqs.length === 0) return null;

  return (
    <div style={list}>
      {faqs.map((f) => {
        const isOpen = openId === f.id;
        return (
          <div key={f.id} style={item}>
            <button
              type="button"
              style={question}
              onClick={() => setOpenId(isOpen ? null : f.id)}
              aria-expanded={isOpen}
            >
              <span>{f.question}</span>
              <ChevronDown
                size={18}
                style={{ ...chevron, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
            {isOpen && <p style={answer}>{f.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}

const list: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const item: React.CSSProperties = {
  background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: 14, overflow: "hidden",
};
const question: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
  padding: "1.1rem 1.4rem", background: "none", border: "none", cursor: "pointer", textAlign: "left",
  fontSize: "1rem", fontWeight: 700, color: "var(--c-ink)",
};
const chevron: React.CSSProperties = { flexShrink: 0, color: "var(--c-text-secondary)", transition: "transform 0.15s ease" };
const answer: React.CSSProperties = {
  margin: 0, padding: "0 1.4rem 1.25rem", fontSize: "0.92rem", lineHeight: 1.6, color: "var(--c-text-secondary)", whiteSpace: "pre-wrap",
};
