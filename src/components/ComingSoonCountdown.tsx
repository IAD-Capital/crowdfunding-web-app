"use client";

import { useEffect, useState } from "react";

export default function ComingSoonCountdown({ expiresAt }: { expiresAt: string }) {
  const target = new Date(expiresAt).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [target]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);

  return (
    <div style={box}>
      <Unit value={days} label="DÍAS" />
      <span style={sep}>:</span>
      <Unit value={hours} label="HORAS" />
      <span style={sep}>:</span>
      <Unit value={minutes} label="MIN" />
      <span style={sep}>:</span>
      <Unit value={seconds} label="SEG" />
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div style={unit}>
      {/* Server and client render this a moment apart, so the number can legitimately differ by a second. */}
      <span style={num} suppressHydrationWarning>{String(value).padStart(2, "0")}</span>
      <span style={lbl}>{label}</span>
    </div>
  );
}

const dropShadow = "0px 2px 2px rgba(0,0,0,0.25)";

const box: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "clamp(0.6rem, 0.35rem + 1vw, 1.1rem)",
  background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 18, padding: "clamp(1.5rem, 1.1rem + 1.2vw, 2.5rem) clamp(1.75rem, 1.2rem + 2vw, 3.25rem)",
  backdropFilter: "blur(6px)", boxShadow: dropShadow,
};
const unit: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", minWidth: "clamp(60px, 46px + 4vw, 100px)" };
const num: React.CSSProperties = {
  fontSize: "clamp(2.75rem, 1.3rem + 3.5vw, 4.75rem)", fontWeight: 800, color: "#fff",
  letterSpacing: "-0.02em", lineHeight: 1, textShadow: dropShadow,
};
const lbl: React.CSSProperties = {
  fontSize: "clamp(0.7rem, 0.6rem + 0.3vw, 0.85rem)", fontWeight: 600,
  color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textShadow: dropShadow,
};
const sep: React.CSSProperties = {
  fontSize: "clamp(2.1rem, 1.1rem + 2.6vw, 3.5rem)", fontWeight: 700,
  color: "rgba(255,255,255,0.35)", marginTop: "-0.5em", textShadow: dropShadow,
};
