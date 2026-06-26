import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const users = await db`
    SELECT id, full_name, email, role, avatar, phone, alternate_email, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { full_name, email, password, role, avatar, phone, alternate_email } = await req.json();

  if (!full_name?.trim() || !email?.trim() || !password || !role) {
    return NextResponse.json({ error: "All fields required." }, { status: 400 });
  }
  if (!["superadmin", "investor"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const password_hash = await hashPassword(password);

  try {
    const [user] = await db`
      INSERT INTO users (full_name, email, password_hash, role, avatar, phone, alternate_email)
      VALUES (
        ${full_name.trim()}, ${email.toLowerCase().trim()}, ${password_hash}, ${role}, ${avatar ?? null},
        ${phone?.trim() || null}, ${alternate_email?.toLowerCase().trim() || null}
      )
      RETURNING id, full_name, email, role, avatar, phone, alternate_email, created_at
    `;
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
