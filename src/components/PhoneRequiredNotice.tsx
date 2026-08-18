type Props = { lang: string };

export default function PhoneRequiredNotice({ lang }: Props) {
  return (
    <div style={box}>
      <p style={title}>Necesitás cargar tu teléfono</p>
      <p style={text}>
        Para invertir necesitamos confirmar tu identidad por WhatsApp. Agregá tu número de teléfono en tu perfil para continuar.
      </p>
      <a href={`/${lang}/profile`} style={link}>Completar mi perfil →</a>
    </div>
  );
}

const box: React.CSSProperties = {
  background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 14,
  padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem",
};
const title: React.CSSProperties = { fontWeight: 700, fontSize: "0.95rem", color: "#92400e", margin: 0 };
const text: React.CSSProperties = { fontSize: "0.85rem", color: "#92400e", margin: 0, lineHeight: 1.5 };
const link: React.CSSProperties = {
  marginTop: "0.25rem", display: "inline-block", padding: "0.65rem 1rem",
  background: "#111", color: "#fff", borderRadius: 10, textDecoration: "none",
  fontWeight: 700, fontSize: "0.85rem", textAlign: "center",
};
