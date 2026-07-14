import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { hashPassword } from "@/lib/password";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";
import { cleanupImages } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const [user] = await db`
    SELECT id, full_name, email, role, avatar, phone, alternate_email
    FROM users WHERE id = ${session!.sub}
  `;
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const { full_name, email, password, avatar, phone, alternate_email } = await req.json();

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nombre y email son obligatorios." }, { status: 400 });
  }

  const [existing] = await db`SELECT avatar FROM users WHERE id = ${session!.sub}`;
  const oldAvatar: string | null = existing?.avatar ?? null;

  try {
    let user;
    if (password) {
      const password_hash = await hashPassword(password);
      [user] = await db`
        UPDATE users SET
          full_name = ${full_name.trim()},
          email = ${email.toLowerCase().trim()},
          password_hash = ${password_hash},
          avatar = ${avatar ?? null},
          phone = ${phone?.trim() || null},
          alternate_email = ${alternate_email?.toLowerCase().trim() || null}
        WHERE id = ${session!.sub}
        RETURNING id, full_name, email, role, avatar, phone, alternate_email
      `;
    } else {
      [user] = await db`
        UPDATE users SET
          full_name = ${full_name.trim()},
          email = ${email.toLowerCase().trim()},
          avatar = ${avatar ?? null},
          phone = ${phone?.trim() || null},
          alternate_email = ${alternate_email?.toLowerCase().trim() || null}
        WHERE id = ${session!.sub}
        RETURNING id, full_name, email, role, avatar, phone, alternate_email
      `;
    }
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (oldAvatar && oldAvatar !== user.avatar) {
      await cleanupImages([oldAvatar]);
    }

    // Re-issue JWT so topbar avatar/name update immediately
    const newToken = await signToken({
      sub: String(user.id),
      email: String(user.email),
      role: user.role as "superadmin" | "investor",
      fullName: String(user.full_name),
      avatar: user.avatar ? String(user.avatar) : null,
    });
    cookies().set(COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(user);
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Email ya está en uso." }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al actualizar perfil." }, { status: 500 });
  }
}
