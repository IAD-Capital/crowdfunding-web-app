import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword, PASSWORD_RULES } from "@/lib/password";
import { hashResetToken } from "@/lib/passwordReset";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }

  if (!PASSWORD_RULES.test(password)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character." },
      { status: 400 }
    );
  }

  const tokenHash = hashResetToken(token);
  const [reset] = await db`
    SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ${tokenHash}
  `;

  if (!reset || reset.used_at || new Date(reset.expires_at) < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const hash = await hashPassword(password);

  // Bumping token_version invalidates every session issued before now
  // (checked in getSession()) — this is the "log out everywhere" step.
  await db`
    UPDATE users SET password_hash = ${hash}, token_version = token_version + 1
    WHERE id = ${reset.user_id}
  `;

  // Invalidate this token and any other outstanding ones for the same user,
  // so an older unread reset email can't also be used.
  await db`
    UPDATE password_resets SET used_at = NOW()
    WHERE user_id = ${reset.user_id} AND used_at IS NULL
  `;

  return NextResponse.json({ ok: true });
}
