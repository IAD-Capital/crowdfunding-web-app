import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const [dev] = await db`SELECT * FROM developments WHERE id = ${params.id}`;
  if (!dev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const units = await db`SELECT * FROM units WHERE development_id = ${params.id} ORDER BY floor, identifier`;
  return NextResponse.json({ ...dev, units });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, address, description, completion_date, status, amenities, images } = body;

  const [row] = await db`
    UPDATE developments SET
      name            = ${name},
      address         = ${address},
      description     = ${description ?? null},
      completion_date = ${completion_date ?? null},
      status          = ${status ?? "active"},
      amenities       = ${amenities ?? []},
      images          = ${images ?? []},
      updated_at      = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  await db`DELETE FROM developments WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
