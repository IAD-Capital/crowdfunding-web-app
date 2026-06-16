import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword, PASSWORD_RULES } from "@/lib/password";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { fullName, email, password } = await req.json();

  if (!fullName?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!PASSWORD_RULES.test(password)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character." },
      { status: 400 }
    );
  }

  const existing = await db`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const hash = await hashPassword(password);
  const [user] = await db`
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES (${fullName.trim()}, ${email.toLowerCase()}, ${hash}, 'admin')
    RETURNING id, email, full_name, role
  `;

  const token = await signToken({
    sub: String(user.id),
    email: user.email,
    role: "admin",
    fullName: user.full_name,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
