import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const rows = await db`SELECT * FROM faq_sections ORDER BY sort_order, id`;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const name = (body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const [row] = await db`
    INSERT INTO faq_sections (name, sort_order)
    VALUES (${name}, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM faq_sections))
    RETURNING *
  `;

  return NextResponse.json(row, { status: 201 });
}
