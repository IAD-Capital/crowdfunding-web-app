import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [developer] = await db`SELECT * FROM developers WHERE id = ${params.id}`;
  if (!developer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const developments = await db`
    SELECT id, name FROM developments WHERE developer_id = ${params.id} ORDER BY name
  `;
  return NextResponse.json({ ...developer, developments });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, website, logo, development_ids } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const [row] = await db`
    UPDATE developers SET
      name       = ${name.trim()},
      website    = ${website?.trim() || null},
      logo       = ${logo || null},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (Array.isArray(development_ids)) {
    // Detach developments no longer selected, attach the ones now selected.
    if (development_ids.length > 0) {
      await db`
        UPDATE developments SET developer_id = NULL
        WHERE developer_id = ${params.id} AND id != ALL(${development_ids}::int[])
      `;
      await db`UPDATE developments SET developer_id = ${params.id} WHERE id = ANY(${development_ids}::int[])`;
    } else {
      await db`UPDATE developments SET developer_id = NULL WHERE developer_id = ${params.id}`;
    }
  }

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  await db`UPDATE developments SET developer_id = NULL WHERE developer_id = ${params.id}`;
  await db`DELETE FROM developers WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
