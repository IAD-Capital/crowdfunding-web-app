import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";

type Ctx = { params: { id: string } };

// Investor requests removal
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  if (session!.role !== "investor") {
    return NextResponse.json({ error: "Solo los inversores pueden solicitar remoción." }, { status: 403 });
  }

  const [inv] = await db`
    SELECT id, user_id, status, removal_requested_at
    FROM investments WHERE id = ${params.id}
  `;
  if (!inv) return NextResponse.json({ error: "Inversión no encontrada." }, { status: 404 });
  if (Number(inv.user_id) !== Number(session!.sub)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  if (inv.status !== "active") {
    return NextResponse.json({ error: "Solo se pueden solicitar remociones de inversiones activas." }, { status: 409 });
  }
  if (inv.removal_requested_at) {
    return NextResponse.json({ error: "Ya existe una solicitud de remoción pendiente." }, { status: 409 });
  }

  const [updated] = await db`
    UPDATE investments SET removal_requested_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(updated);
}

// Investor cancels their own removal request
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  if (session!.role !== "investor") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [inv] = await db`SELECT id, user_id FROM investments WHERE id = ${params.id}`;
  if (!inv) return NextResponse.json({ error: "Inversión no encontrada." }, { status: 404 });
  if (Number(inv.user_id) !== Number(session!.sub)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const [updated] = await db`
    UPDATE investments SET removal_requested_at = NULL
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(updated);
}
