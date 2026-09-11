"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";

export type PublicFaq = {
  id: number;
  question: string;
  answer: string;
  section_id: number | null;
  section_name: string | null;
};

type Props = { faqs: PublicFaq[] };

export default function FaqAccordionSection({ faqs }: Props) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);

  if (faqs.length === 0) return null;

  let lastSectionId: number | null = null;

  return (
    <div style={list}>
      {faqs.map((f, i) => {
        const isOpen = openId === f.id;
        const showHeading = !!f.section_name && f.section_id !== lastSectionId;
        lastSectionId = f.section_id;
        return (
          <Fragment key={f.id}>
            {showHeading && (
              <h3 style={{ ...sectionHeading, marginTop: i === 0 ? 0 : "0.75rem" }}>{f.section_name}</h3>
            )}
            <div style={item}>
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
          </Fragment>
        );
      })}
    </div>
  );
}

const list: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "0.75rem" };
const sectionHeading: React.CSSProperties = {
  fontSize: "1.05rem", fontWeight: 800, color: "var(--c-ink)", margin: 0, letterSpacing: "-0.01em",
};
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
