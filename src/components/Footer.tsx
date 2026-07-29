import Link from "next/link";
import Image from "next/image";
import { getDictionary, type Locale } from "@/i18n";
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
        </div>

        <div className={s.linkCols}>
          <div className={s.linkCol}>
            <div className={s.linkColTitle}>Plataforma</div>
            <a href={`/${lang}#emprendimientos`} className={s.linkColLink}>Emprendimientos</a>
            <a href={`/${lang}#como-funciona`} className={s.linkColLink}>Cómo funciona</a>
            <a href={`/${lang}#simulador`} className={s.linkColLink}>Simulador</a>
          </div>
          <div className={s.linkCol}>
            <div className={s.linkColTitle}>Cuenta</div>
            <Link href={`/${lang}/login`} className={s.linkColLink}>Iniciar sesión</Link>
            <Link href={`/${lang}/signup`} className={s.linkColLink}>Registrarse</Link>
          </div>
        </div>
      </div>

      <div className={s.bottomBar}>
        <p className={s.copy}>© {year} IAD Capital. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
