import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const rows = await db`
    SELECT
      i.id, i.percentage, i.amount_usd, i.status, i.created_at,
      u.id AS unit_id, u.identifier, u.floor, u.total_m2, u.price_usd AS unit_price_usd,
      u.status AS unit_status, u.images AS unit_images,
      d.id AS development_id, d.name AS development_name, d.address AS development_address,
      d.images AS development_images
    FROM investments i
    JOIN units u ON u.id = i.unit_id
    JOIN developments d ON d.id = u.development_id
    WHERE i.user_id = ${session!.sub}
    ORDER BY i.created_at DESC
  `;
  return NextResponse.json(rows);
}
