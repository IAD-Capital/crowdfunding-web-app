import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import ScrollHeader from "./ScrollHeader";
import type { Locale } from "@/i18n";
import s from "./Header.module.scss";

// Suspense fallback for Header — same markup shell (logo, CTA, auth links) so
// there's no layout shift, but nothing here needs a DB query (session, mega
// menu units, notifications). Shown for the brief moment those resolve, then
// swapped for the real Header.
export default function HeaderFallback({ lang }: { lang: Locale }) {
  return (
    <ScrollHeader>
      <div className={s.inner}>
        <Link href={`/${lang}`} className={s.brand}>
          <Image src="/iad-logo.svg" alt="IAD Capital" width={449} height={226} className={s.logo} priority />
        </Link>

        <nav className={s.centerNav}>
          <div className={s.navItem}>
            <Link href={`/${lang}#catalog`} className={s.navLink}>
              Propiedades
            </Link>
          </div>
        </nav>

        <div className={s.right}>
          <Link href={`/${lang}/como-invertir`} className={s.btnCta}>
            Quiero invertir
          </Link>
          <Link href={`/${lang}/login`} className={s.navLink}>
            Iniciar sesión
          </Link>
          <Link href={`/${lang}/signup`} className={s.btnOutline}>
            Registrarse
          </Link>
        </div>

        <button className={s.hamburgerBtn} aria-hidden tabIndex={-1}>
          <Menu size={22} />
        </button>
      </div>
    </ScrollHeader>
  );
}
