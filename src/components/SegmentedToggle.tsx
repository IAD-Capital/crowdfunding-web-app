"use client";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: [Option<T>, Option<T>];
  value: T;
  onChange: (value: T) => void;
};

export default function SegmentedToggle<T extends string>({ options, value, onChange }: Props<T>) {
  const activeIndex = options.findIndex((o) => o.value === value);

  return (
    <div style={track}>
      <div style={{ ...thumb, left: activeIndex === 0 ? "4px" : "50%" }} />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          style={{ ...btn, ...(opt.value === value ? btnActive : {}) }}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const track: React.CSSProperties = {
  position: "relative", display: "flex", background: "var(--c-field-bg)",
  border: "1px solid var(--c-border)", borderRadius: 999, padding: 4,
};
const thumb: React.CSSProperties = {
  position: "absolute", top: 4, bottom: 4, width: "calc(50% - 4px)",
  borderRadius: 999, background: "var(--c-accent)",
  transition: "left 0.35s cubic-bezier(0.65, 0, 0.35, 1)",
};
const btn: React.CSSProperties = {
  position: "relative", zIndex: 1, flex: 1, background: "transparent", border: "none",
  padding: "0.7rem 1rem", fontSize: "0.85rem", fontWeight: 700, borderRadius: 999,
  cursor: "pointer", color: "var(--c-text-secondary)", transition: "color 0.25s",
};
const btnActive: React.CSSProperties = { color: "#fff" };
