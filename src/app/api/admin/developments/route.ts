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
    ORDER BY d.created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, address, description, completion_date, status, amenities, images } = body;

  if (!name?.trim() || !address?.trim()) {
    return NextResponse.json({ error: "Name and address are required." }, { status: 400 });
  }

  const [row] = await db`
    INSERT INTO developments (name, address, description, completion_date, status, amenities, images)
    VALUES (
      ${name.trim()}, ${address.trim()}, ${description ?? null},
      ${completion_date ?? null}, ${status ?? "active"},
      ${amenities ?? []}, ${images ?? []}
    )
    RETURNING *
  `;
  return NextResponse.json(row, { status: 201 });
}
