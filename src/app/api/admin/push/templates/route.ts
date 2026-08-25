import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { title, body, url } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title y body son obligatorios" }, { status: 400 });
  }

  try {
    const [template] = await db`
      INSERT INTO push_templates (title, body, url)
      VALUES (${title}, ${body}, ${url || null})
      RETURNING id, title, body, url, created_at
    `;
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
