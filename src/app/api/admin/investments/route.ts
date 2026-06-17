import { NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const rows = await db`
    SELECT
      i.id, i.percentage, i.amount_usd, i.status, i.created_at,
      u.id AS unit_id, u.identifier, u.price_usd AS unit_price_usd,
      d.id AS development_id, d.name AS development_name,
      usr.id AS user_id, usr.full_name, usr.email, usr.avatar
    FROM investments i
    JOIN units u ON u.id = i.unit_id
    JOIN developments d ON d.id = u.development_id
    JOIN users usr ON usr.id = i.user_id
    ORDER BY i.created_at DESC
  `;
  return NextResponse.json(rows);
}
