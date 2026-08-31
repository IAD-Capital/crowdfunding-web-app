import { isValidLocale, DEFAULT_LOCALE, type Locale } from "@/i18n";
import PublicShell from "@/components/PublicShell";
import FaqAccordionSection, { type PublicFaq } from "@/components/FaqAccordionSection";
import db from "@/lib/db";

const STEPS = [
  { n: "01", title: "Elegí tu unidad", desc: "Explorá nuestro catálogo de departamentos disponibles para invertir." },
  { n: "02", title: "Definí tu porcentaje", desc: "Invertí desde el 5% hasta el 100% del valor de la unidad funcional." },
  { n: "03", title: "Formalizá tu inversión", desc: "Completá el proceso de manera segura y comenzá a generar rendimientos." },
];

export default async function ComoInvertirPage({ params }: { params: { lang: string } }) {
  const lang: Locale = isValidLocale(params.lang) ? params.lang : DEFAULT_LOCALE;

  const faqs = await db<PublicFaq[]>`
    SELECT id, question, answer FROM faqs
    WHERE is_active = true
    ORDER BY sort_order, id
  `;

  return (
    <PublicShell lang={lang}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media (max-width: 760px) {
          .como-invertir-steps { grid-template-columns: 1fr !important; }
        }
      `,
        }}
      />

      <section style={heroSection}>
        <div style={heroInner}>
          <div style={eyebrow}>Cómo invertir</div>
          <h1 style={heroTitle}>Invertí en tres pasos simples</h1>
          <p style={heroDesc}>
            Empezá a construir tu cartera inmobiliaria en pocos minutos, con total transparencia
            en cada etapa del proceso.
          </p>
        </div>
      </section>

      <section style={stepsSection}>
        <div style={stepsGrid} className="como-invertir-steps">
          {STEPS.map((s) => (
            <div key={s.n} style={stepCard}>
              <span style={stepNum}>{s.n}</span>
              <h3 style={stepTitle}>{s.title}</h3>
              <p style={stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={faqSection}>
        <div style={faqInner}>
          <div style={faqHeader}>
            <div style={eyebrow}>Preguntas frecuentes</div>
            <h2 style={faqTitle}>¿Tenés dudas?</h2>
          </div>
          {faqs.length > 0 ? (
            <FaqAccordionSection faqs={faqs} />
          ) : (
            <p style={{ color: "var(--c-text-secondary)" }}>Todavía no hay preguntas frecuentes cargadas.</p>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--c-accent)",
  textTransform: "uppercase", marginBottom: "0.7rem",
};

const heroSection: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "4rem 1.5rem 1rem" };
const heroInner: React.CSSProperties = { maxWidth: 640 };
const heroTitle: React.CSSProperties = { fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0, color: "var(--c-ink)", lineHeight: 1.15 };
const heroDesc: React.CSSProperties = { fontSize: "1rem", lineHeight: 1.6, color: "var(--c-text-secondary)", marginTop: "1rem" };

const stepsSection: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" };
const stepsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" };
const stepCard: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.6rem",
  padding: "2rem", borderRadius: 18, border: "1px solid var(--c-border)", background: "var(--c-surface)",
};
const stepNum: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "0.95rem", fontWeight: 800, color: "var(--c-accent)", marginBottom: "1.5rem" };
const stepTitle: React.CSSProperties = { fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--c-ink)" };
const stepDesc: React.CSSProperties = { fontSize: "0.92rem", lineHeight: 1.55, color: "var(--c-text-secondary)", margin: 0 };

const faqSection: React.CSSProperties = { background: "var(--c-accent-light)", marginTop: "1rem" };
const faqInner: React.CSSProperties = { maxWidth: 800, margin: "0 auto", padding: "4rem 1.5rem" };
const faqHeader: React.CSSProperties = { marginBottom: "2rem" };
const faqTitle: React.CSSProperties = { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.025em", margin: 0, color: "var(--c-ink)" };
