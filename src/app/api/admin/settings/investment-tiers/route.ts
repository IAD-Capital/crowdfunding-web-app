import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import type { TierThresholds } from "@/lib/investmentTiers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [row] = await db<TierThresholds[]>`
    SELECT silver_from, gold_from, platinum_from FROM app_settings WHERE id = 1
  `;
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const silverFrom = Number(body.silver_from);
  const goldFrom = Number(body.gold_from);
  const platinumFrom = Number(body.platinum_from);

  if (
    [silverFrom, goldFrom, platinumFrom].some((n) => !Number.isFinite(n) || n < 0)
  ) {
    return NextResponse.json({ error: "Los montos deben ser números válidos." }, { status: 400 });
  }
  if (!(silverFrom < goldFrom && goldFrom < platinumFrom)) {
    return NextResponse.json(
      { error: "Los montos deben ser crecientes: Plata < Oro < Platino." },
      { status: 400 }
    );
  }

  const [row] = await db<TierThresholds[]>`
    UPDATE app_settings SET
      silver_from   = ${silverFrom},
      gold_from     = ${goldFrom},
      platinum_from = ${platinumFrom}
    WHERE id = 1
    RETURNING silver_from, gold_from, platinum_from
  `;
  return NextResponse.json(row);
}
