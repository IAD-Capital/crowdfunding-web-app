import Link from "next/link";
import Image from "next/image";
import { getDictionary, type Locale } from "@/i18n";
import TrackedLink from "./TrackedLink";
import TrackedAnchor from "./TrackedAnchor";
import s from "./Footer.module.scss";

type Props = { lang: Locale };

export default async function Footer({ lang }: Props) {
  const t = await getDictionary(lang);
  const year = new Date().getFullYear();

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.left}>
          <Link href={`/${lang}`} className={s.brand}>
            <Image src="/iad-capital-logo.svg" alt="IAD Capital" width={415} height={297} className={s.logo} />
          </Link>
          <p className={s.tagline}>{t.footer.tagline}</p>
          <div className={s.social}>
            <TrackedAnchor
              href="https://www.instagram.com/iadcapital"
              target="_blank"
              rel="noopener noreferrer"
              className={s.socialLink}
              aria-label="Instagram"
              ctaId="footer_instagram"
              ctaLabel="Instagram"
              ctaLocation="footer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </TrackedAnchor>
          </div>
        </div>

        <div className={s.linkCols}>
          <div className={s.linkCol}>
            <div className={s.linkColTitle}>Plataforma</div>
            <a href={`/${lang}#catalog`} className={s.linkColLink}>Departamentos</a>
            <a href={`/${lang}#how-it-works`} className={s.linkColLink}>Cómo funciona</a>
            <Link href={`/${lang}/como-invertir`} className={s.linkColLink}>Cómo invertir</Link>
            <a href={`/${lang}#simulator`} className={s.linkColLink}>Simulador</a>
          </div>
          <div className={s.linkCol}>
            <div className={s.linkColTitle}>Cuenta</div>
            <TrackedLink
              href={`/${lang}/login`}
              className={s.linkColLink}
              ctaId="footer_login"
              ctaLabel="Iniciar sesión"
              ctaLocation="footer"
            >
              Iniciar sesión
            </TrackedLink>
            <TrackedLink
              href={`/${lang}/signup`}
              className={s.linkColLink}
              ctaId="footer_signup"
              ctaLabel="Registrarse"
              ctaLocation="footer"
            >
              Registrarse
            </TrackedLink>
          </div>
        </div>
      </div>

      <div className={s.bottomBar}>
        <p className={s.copy}>© {year} IAD Capital. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
