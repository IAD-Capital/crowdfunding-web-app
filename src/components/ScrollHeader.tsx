"use client";

import { useEffect, useState } from "react";
import s from "./Header.module.scss";

export default function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    function update() {
      setScrolled(window.scrollY > 20);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className={s.headerSpacer} />
      <header className={`${s.header} ${scrolled ? s.headerScrolled : ""}`}>
        {children}
      </header>
    </>
  );
}
