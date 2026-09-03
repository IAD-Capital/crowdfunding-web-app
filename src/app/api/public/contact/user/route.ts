import { NextRequest, NextResponse } from "next/server";
import { sendMail, renderEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

const NOTIFY_EMAIL = "iadcapital.app@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const fullName = String(body.fullName ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const message = String(body.message ?? "").trim();
  const unitLabel = typeof body.unitLabel === "string" ? body.unitLabel.trim() : "";
  const unitUrl = typeof body.unitUrl === "string" ? body.unitUrl.trim() : "";

  if (!fullName || !email || !message) {
    return NextResponse.json({ error: "Completá todos los campos obligatorios." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
  }

  const subject = unitLabel
    ? `Consulta por unidad: ${unitLabel}`
    : `Nuevo contacto desde la web: ${fullName}`;

  const result = await sendMail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    subject,
    html: renderEmail(`
      <p>Nuevo contacto desde la web de IAD Capital.</p>
      <p><strong>Nombre:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
      ${unitLabel ? `<p><strong>Unidad de interés:</strong> ${unitLabel}${unitUrl ? ` (<a href="${unitUrl}">ver unidad</a>)` : ""}</p>` : ""}
      <p><strong>Mensaje:</strong></p>
      <p style="white-space: pre-wrap;">${message}</p>
    `),
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.error ?? "No se pudo enviar el mensaje." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
