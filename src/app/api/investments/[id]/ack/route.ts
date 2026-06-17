import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const [inv] = await db`SELECT id, user_id FROM investments WHERE id = ${params.id}`;
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (Number(inv.user_id) !== Number(session!.sub)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await db`UPDATE investments SET removal_ack_at = NOW() WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
