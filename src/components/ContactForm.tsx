"use client";

import { useState, FormEvent } from "react";
import { Send } from "lucide-react";
import { Field, FieldStyles, SuccessBox, form, formTitle, formDesc, row, errorStyle, btnPrimary } from "./contactFormKit";

type UnitContext = { label: string; url: string };

type Props = {
  unitContext?: UnitContext;
  title?: string;
  description?: string;
  initialFullName?: string;
  initialEmail?: string;
  initialPhone?: string;
};

export default function ContactForm({
  unitContext, title, description,
  initialFullName = "", initialEmail = "", initialPhone = "",
}: Props) {
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState(unitContext ? `Quisiera recibir más información sobre ${unitContext.label}.` : "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    const res = await fetch("/api/public/contact/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        message,
        unitLabel: unitContext?.label,
        unitUrl: unitContext?.url,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult({ ok: false, message: data.error ?? "No se pudo enviar el mensaje." });
      return;
    }
    setResult({ ok: true, message: "¡Gracias! Recibimos tu mensaje y te vamos a contactar a la brevedad." });
    setFullName(initialFullName);
    setEmail(initialEmail);
    setPhone(initialPhone);
    setMessage(unitContext ? `Quisiera recibir más información sobre ${unitContext.label}.` : "");
  }

  return (
    <>
      <FieldStyles />
      {result?.ok ? (
        <SuccessBox message={result.message} />
      ) : (
        <form onSubmit={handleSubmit} style={form}>
          {title && <h3 style={formTitle}>{title}</h3>}
          {description && <p style={formDesc}>{description}</p>}

          <div style={row} className="contact-form-row">
            <Field label="Nombre completo">
              <input className="cf-input" placeholder=" " value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </Field>
            <Field label="Email">
              <input type="email" className="cf-input" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
          </div>
          <Field label="Teléfono (opcional)">
            <input className="cf-input" placeholder=" " value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Mensaje">
            <textarea
              className="cf-textarea"
              placeholder=" "
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </Field>

          {result && !result.ok && <p style={errorStyle}>{result.message}</p>}

          <button type="submit" style={btnPrimary} className="cf-submit" disabled={loading}>
            {loading ? "Enviando…" : (
              <>
                Enviar mensaje <Send size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}
