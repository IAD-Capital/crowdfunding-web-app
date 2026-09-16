import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

type InstallAppSettings = { install_app_enabled: boolean };

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [row] = await db<InstallAppSettings[]>`
    SELECT install_app_enabled FROM app_settings WHERE id = 1
  `;
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const enabled = !!body.install_app_enabled;

  const [row] = await db<InstallAppSettings[]>`
    UPDATE app_settings SET install_app_enabled = ${enabled}
    WHERE id = 1
    RETURNING install_app_enabled
  `;
  return NextResponse.json(row);
}
