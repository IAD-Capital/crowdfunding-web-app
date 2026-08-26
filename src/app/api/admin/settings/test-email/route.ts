import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { sendMail, renderEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const to = (body.to ?? "").trim();

  if (!to) {
    return NextResponse.json({ error: "Seleccioná un destinatario." }, { status: 400 });
  }

  const [user] = await db`SELECT id FROM users WHERE email = ${to}`;
  if (!user) {
    return NextResponse.json({ error: "Ese email no corresponde a un usuario registrado." }, { status: 400 });
  }

  const sender = process.env.MAIL_USER ?? "iadcapital.app@gmail.com";
  const result = await sendMail({
    to,
    subject: "Email de prueba — IAD Capital",
    html: renderEmail(`
      <p>Este es un email de prueba enviado desde el panel de administración.</p>
      <p>Remitente: <strong>${sender}</strong></p>
      <p>Enviado el ${new Date().toLocaleString("es-AR")}.</p>
    `),
  });

  if (!result.sent) {
    return NextResponse.json({ error: result.error ?? "No se pudo enviar el email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, from: sender, to });
}
