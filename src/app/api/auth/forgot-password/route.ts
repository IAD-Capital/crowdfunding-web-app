import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendMail, getAppUrl, renderEmail } from "@/lib/mail";
import { generateResetToken, RESET_TOKEN_TTL_MS } from "@/lib/passwordReset";
import { isValidLocale, DEFAULT_LOCALE } from "@/i18n";

export async function POST(req: NextRequest) {
  const { email, lang } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const locale = isValidLocale(lang) ? lang : DEFAULT_LOCALE;

  const [user] = await db`
    SELECT id, email, full_name FROM users WHERE email = ${email.toLowerCase()}
  `;

  // Always respond the same way whether or not the email exists, so this
  // endpoint can't be used to discover which addresses have an account.
  if (user) {
    const { token, tokenHash } = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await db`
      INSERT INTO password_resets (user_id, token_hash, expires_at)
      VALUES (${user.id}, ${tokenHash}, ${expiresAt})
    `;

    const resetUrl = `${getAppUrl()}/${locale}/reset-password?token=${token}`;

    await sendMail({
      to: user.email,
      subject: "Recuperá tu contraseña de IAD Capital",
      html: renderEmail(`
        <p>Hola ${user.full_name},</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en IAD Capital.</p>
        <p><a href="${resetUrl}">Restablecer mi contraseña</a></p>
        <p>Este enlace vence en 1 hora. Si no solicitaste este cambio, podés ignorar este correo.</p>
      `),
    });
  }

  return NextResponse.json({ ok: true });
}
