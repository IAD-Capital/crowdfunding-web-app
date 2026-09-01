import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/googleAuth";
import { sendMail, getAppUrl, renderEmail } from "@/lib/mail";

export async function POST(req: NextRequest) {
  const { credential } = await req.json();

  if (!credential) {
    return NextResponse.json({ error: "Missing Google credential." }, { status: 400 });
  }

  const profile = await verifyGoogleIdToken(credential);
  if (!profile) {
    return NextResponse.json({ error: "Invalid Google credential." }, { status: 401 });
  }

  let [user] = await db`
    SELECT id, email, full_name, role, avatar, token_version
    FROM users
    WHERE google_id = ${profile.googleId}
  `;

  let isNewUser = false;

  if (!user) {
    const [existingByEmail] = await db`
      SELECT id, email, full_name, role, avatar, token_version
      FROM users
      WHERE email = ${profile.email}
    `;

    if (existingByEmail) {
      [user] = await db`
        UPDATE users
        SET google_id = ${profile.googleId}, avatar = COALESCE(avatar, ${profile.avatar})
        WHERE id = ${existingByEmail.id}
        RETURNING id, email, full_name, role, avatar, token_version
      `;
    } else {
      isNewUser = true;
      [user] = await db`
        INSERT INTO users (full_name, email, google_id, avatar, role)
        VALUES (${profile.fullName}, ${profile.email}, ${profile.googleId}, ${profile.avatar}, 'investor')
        RETURNING id, email, full_name, role, avatar, token_version
      `;
    }
  }

  if (user.role !== "superadmin" && user.role !== "investor") {
    return NextResponse.json({ error: "Invalid account." }, { status: 401 });
  }

  const token = await signToken({
    sub: String(user.id),
    email: user.email,
    role: user.role as "superadmin" | "investor",
    fullName: user.full_name,
    avatar: user.avatar ?? null,
    tokenVersion: user.token_version,
  });

  if (isNewUser) {
    await sendMail({
      to: user.email,
      subject: "Tu cuenta en IAD Capital fue creada",
      html: renderEmail(`
        <p>Hola ${user.full_name},</p>
        <p>Tu cuenta en IAD Capital fue creada correctamente con el email <strong>${user.email}</strong>.</p>
        <p>Ya podés explorar los emprendimientos disponibles y empezar a invertir.</p>
        <p><a href="${getAppUrl()}">Ver oportunidades de inversión</a></p>
      `),
    });
  }

  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
