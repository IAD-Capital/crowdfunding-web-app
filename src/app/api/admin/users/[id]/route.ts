import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { hashPassword } from "@/lib/password";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [user] = await db`
    SELECT id, full_name, email, role, avatar, phone, alternate_email, created_at
    FROM users WHERE id = ${params.id}
  `;
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { full_name, email, password, role, avatar, phone, alternate_email } = await req.json();

  if (!full_name?.trim() || !email?.trim() || !role) {
    return NextResponse.json({ error: "Name, email and role are required." }, { status: 400 });
  }
  if (!["superadmin", "investor"].includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  try {
    let user;
    if (password) {
      const password_hash = await hashPassword(password);
      [user] = await db`
        UPDATE users SET
          full_name = ${full_name.trim()},
          email = ${email.toLowerCase().trim()},
          password_hash = ${password_hash},
          role = ${role},
          avatar = ${avatar ?? null},
          phone = ${phone?.trim() || null},
          alternate_email = ${alternate_email?.toLowerCase().trim() || null}
        WHERE id = ${params.id}
        RETURNING id, full_name, email, role, avatar, phone, alternate_email, created_at
      `;
    } else {
      [user] = await db`
        UPDATE users SET
          full_name = ${full_name.trim()},
          email = ${email.toLowerCase().trim()},
          role = ${role},
          avatar = ${avatar ?? null},
          phone = ${phone?.trim() || null},
          alternate_email = ${alternate_email?.toLowerCase().trim() || null}
        WHERE id = ${params.id}
        RETURNING id, full_name, email, role, avatar, phone, alternate_email, created_at
      `;
    }
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireSuperAdmin();
  if (error) return error;

  if (String(session!.sub) === params.id) {
    return NextResponse.json({ error: "Cannot delete your own account." }, { status: 400 });
  }

  await db`DELETE FROM users WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
