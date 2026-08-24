import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  await db`DELETE FROM push_templates WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
