import Link from "next/link";
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
          <Link href={`/${lang}`} className={s.brand}>IAD Capital</Link>
          <p className={s.tagline}>{t.footer.tagline}</p>
        </div>
        <p className={s.copy}>© {year} IAD Capital. {t.footer.rights}</p>
      </div>
    </footer>
  );
}
