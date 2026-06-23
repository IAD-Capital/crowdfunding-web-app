import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const [dev] = await db`SELECT * FROM developments WHERE id = ${params.id}`;
  if (!dev) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [copy] = await db`
    INSERT INTO developments (name, address, description, completion_date, status, amenities, images, featured)
    VALUES (
      ${dev.name + " (copia)"}, ${dev.address}, ${dev.description},
      ${dev.completion_date}, ${dev.status},
      ${dev.amenities}, ${dev.images}, false
    )
    RETURNING *
  `;

  const units = await db`SELECT * FROM units WHERE development_id = ${params.id}`;
  for (const u of units) {
    await db`
      INSERT INTO units
        (development_id, identifier, floor, total_m2, covered_m2, uncovered_m2,
         rooms, bedrooms, bathrooms, orientation, price_usd, current_price_usd, status, description, images,
         group_duration_months)
      VALUES (
        ${copy.id}, ${u.identifier},
        ${u.floor}, ${u.total_m2}, ${u.covered_m2}, ${u.uncovered_m2},
        ${u.rooms}, ${u.bedrooms}, ${u.bathrooms}, ${u.orientation},
        ${u.price_usd}, ${u.current_price_usd}, ${"available"}, ${u.description}, ${u.images},
        ${u.group_duration_months}
      )
    `;
  }

  return NextResponse.json(copy, { status: 201 });
}
