import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const rows = await db`
    SELECT dv.*, COUNT(d.id)::int AS development_count
    FROM developers dv
    LEFT JOIN developments d ON d.developer_id = dv.id
    GROUP BY dv.id
    ORDER BY dv.created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, website, logo, development_ids } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const [row] = await db`
    INSERT INTO developers (name, website, logo)
    VALUES (${name.trim()}, ${website?.trim() || null}, ${logo || null})
    RETURNING *
  `;

  if (Array.isArray(development_ids) && development_ids.length > 0) {
    await db`UPDATE developments SET developer_id = ${row.id} WHERE id = ANY(${development_ids}::int[])`;
  }

  return NextResponse.json(row, { status: 201 });
}
