import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { cleanupImages } from "@/lib/storage";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const [dev] = await db`SELECT * FROM developments WHERE id = ${params.id}`;
  if (!dev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const units = await db`SELECT * FROM units WHERE development_id = ${params.id} ORDER BY updated_at DESC`;
  return NextResponse.json({ ...dev, units });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const {
    name, address, neighborhood, city, description, completion_date, status, amenities,
    images, plan_images, interior_images, featured, visible, zone_price_per_m2, slug, developer_id,
  } = body;

  const [existing] = await db`SELECT images, plan_images, interior_images FROM developments WHERE id = ${params.id}`;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const oldImages: string[] = [...(existing.images ?? []), ...(existing.plan_images ?? []), ...(existing.interior_images ?? [])];

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
      plan_images       = ${plan_images ?? []},
      interior_images   = ${interior_images ?? []},
      featured          = ${featured ?? false},
      visible           = ${visible ?? true},
      zone_price_per_m2 = ${zone_price_per_m2 ?? null},
      slug              = ${slug?.trim() || null},
      developer_id      = ${developer_id ?? null},
      updated_at        = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sync images into media table
  const imgList: string[] = [...(images ?? []), ...(plan_images ?? []), ...(interior_images ?? [])];
  if (imgList.length > 0) {
    await db`
      INSERT INTO media (url, development_id)
      SELECT unnest(${imgList}::text[]), ${row.id}
      ON CONFLICT (url) DO UPDATE SET development_id = EXCLUDED.development_id
    `;
  }
  // Clean up storage + media rows for images removed from any array
  const removedImages = oldImages.filter((u) => !imgList.includes(u));
  await cleanupImages(removedImages);

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const [dev] = await db`SELECT images, plan_images, interior_images FROM developments WHERE id = ${params.id}`;
  if (!dev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const units = await db<{ images: string[]; plan_images: string[] }[]>`SELECT images, plan_images FROM units WHERE development_id = ${params.id}`;

  await db`DELETE FROM developments WHERE id = ${params.id}`;

  const allImages = [
    ...(dev.images ?? []), ...(dev.plan_images ?? []), ...(dev.interior_images ?? []),
    ...units.flatMap((u) => [...(u.images ?? []), ...(u.plan_images ?? [])]),
  ];
  await cleanupImages(allImages);

  return NextResponse.json({ ok: true });
}
