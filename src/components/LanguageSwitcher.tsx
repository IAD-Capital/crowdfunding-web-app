"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, type Locale } from "@/i18n";

const labels: Record<Locale, string> = { es: "ES", en: "EN" };

export default function LanguageSwitcher({ currentLang }: { currentLang: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLang(lang: Locale) {
    // Replace the leading /[currentLang] segment with /[lang]
    const newPath = pathname.replace(/^\/[a-z]{2}(\/|$)/, `/${lang}$1`);
    router.push(newPath);
  }

  return (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {LOCALES.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          disabled={lang === currentLang}
          style={{
            padding: "0.25rem 0.6rem",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: lang === currentLang ? "#111" : "#fff",
            color: lang === currentLang ? "#fff" : "#111",
            fontWeight: 600,
            fontSize: "0.8rem",
            cursor: lang === currentLang ? "default" : "pointer",
          }}
        >
          {labels[lang]}
        </button>
      ))}
    </div>
  );
}
