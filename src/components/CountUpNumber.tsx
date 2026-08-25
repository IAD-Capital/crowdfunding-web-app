"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  prefix?: string;
  suffix?: string;
  locale?: string;
  duration?: number;
  delay?: number;
  style?: React.CSSProperties;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function CountUpNumber({ value, prefix = "", suffix = "", locale, duration = 1400, delay = 0, style }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        timeout = setTimeout(() => {
          const start = performance.now();
          const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            setDisplay(value * easeOutExpo(t));
            if (t < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        }, delay);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [value, duration, delay]);

  const rounded = Math.round(display);
  const formatted = locale ? rounded.toLocaleString(locale) : rounded.toString();
  const finalFormatted = locale ? Math.round(value).toLocaleString(locale) : Math.round(value).toString();

  return (
    <span ref={ref} style={style}>
      {prefix}
      <span
        style={{
          display: "inline-block",
          minWidth: `${finalFormatted.length}ch`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatted}
      </span>
      {suffix}
    </span>
  );
}
