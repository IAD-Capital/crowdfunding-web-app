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
  const { name, address, neighborhood, city, description, completion_date, status, amenities, images, featured, visible, zone_price_per_m2 } = body;

  const [row] = await db`
    UPDATE developments SET
      name              = ${name},
      address           = ${address},
      neighborhood      = ${neighborhood?.trim() || null},
      city              = ${city?.trim() || null},
      description       = ${description ?? null},
      completion_date   = ${completion_date ?? null},
      status            = ${status ?? "active"},
      amenities         = ${amenities ?? []},
      images            = ${images ?? []},
      featured          = ${featured ?? false},
      visible           = ${visible ?? true},
      zone_price_per_m2 = ${zone_price_per_m2 ?? null},
      updated_at        = NOW()
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
