import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const developments = await db`
    SELECT
      d.id, d.name, d.address, d.description, d.status,
      d.completion_date, d.amenities, d.images,
      COUNT(u.id)::int AS unit_count
    FROM developments d
    LEFT JOIN units u ON u.development_id = d.id
    WHERE d.status = 'active'
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `;

  const units = await db`
    SELECT
      u.id, u.development_id, u.identifier, u.floor,
      u.total_m2, u.covered_m2, u.rooms, u.bedrooms,
      u.orientation, u.price_usd, u.status, u.images, u.description
    FROM units u
    JOIN developments d ON d.id = u.development_id
    WHERE d.status = 'active'
    ORDER BY u.price_usd ASC
  `;

  return NextResponse.json({ developments, units });
}
