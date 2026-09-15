import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { isSiteFontKey } from "@/lib/siteFonts";

export const dynamic = "force-dynamic";

type SiteFontSettings = { site_font: string };

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [row] = await db<SiteFontSettings[]>`
    SELECT site_font FROM app_settings WHERE id = 1
  `;
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  if (!isSiteFontKey(body.site_font)) {
    return NextResponse.json({ error: "Fuente inválida." }, { status: 400 });
  }

  const [row] = await db<SiteFontSettings[]>`
    UPDATE app_settings SET site_font = ${body.site_font}
    WHERE id = 1
    RETURNING site_font
  `;
  return NextResponse.json(row);
}
