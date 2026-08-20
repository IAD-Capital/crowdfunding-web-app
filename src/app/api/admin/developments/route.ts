import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await db`
    SELECT d.*, COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    GROUP BY d.id
    ORDER BY d.updated_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const {
    name, address, neighborhood, city, description, completion_date, status, amenities,
    images, plan_images, interior_images, featured, visible, zone_price_per_m2, slug, developer_id,
  } = body;

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json({ error: "Name and address are required." }, { status: 400 });
  }

  const [row] = await db`
    INSERT INTO developments (name, address, neighborhood, city, description, completion_date, status, amenities, images, plan_images, interior_images, featured, visible, zone_price_per_m2, slug, developer_id)
    VALUES (
      ${name.trim()}, ${address.trim()}, ${neighborhood?.trim() || null}, ${city?.trim() || null}, ${description ?? null},
      ${completion_date ?? null}, ${status ?? "active"},
      ${amenities ?? []}, ${images ?? []}, ${plan_images ?? []}, ${interior_images ?? []},
      ${featured ?? false}, ${visible ?? true}, ${zone_price_per_m2 ?? null},
      ${slug?.trim() || null}, ${developer_id ?? null}
    )
    RETURNING *
  `;

  // Sync images into media table
  const imgList: string[] = [...(images ?? []), ...(plan_images ?? []), ...(interior_images ?? [])];
  if (imgList.length > 0) {
    await db`
      INSERT INTO media (url, development_id)
      SELECT unnest(${imgList}::text[]), ${row.id}
      ON CONFLICT (url) DO UPDATE SET development_id = EXCLUDED.development_id
    `;
  }

  return NextResponse.json(row, { status: 201 });
}
