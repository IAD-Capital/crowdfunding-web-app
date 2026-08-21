import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

type ComingSoonSettings = { coming_soon_enabled: boolean; coming_soon_expires_at: string | null };

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [row] = await db<ComingSoonSettings[]>`
    SELECT coming_soon_enabled, coming_soon_expires_at FROM app_settings WHERE id = 1
  `;
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const enabled = !!body.coming_soon_enabled;
  const expiresAt = body.coming_soon_expires_at ? new Date(body.coming_soon_expires_at) : null;

  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Fecha de vencimiento inválida." }, { status: 400 });
  }

  const [row] = await db<ComingSoonSettings[]>`
    UPDATE app_settings SET
      coming_soon_enabled    = ${enabled},
      coming_soon_expires_at = ${expiresAt}
    WHERE id = 1
    RETURNING coming_soon_enabled, coming_soon_expires_at
  `;
  return NextResponse.json(row);
}
