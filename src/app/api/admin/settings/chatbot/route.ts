import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";

type ChatbotSettings = { chatbot_enabled: boolean };

export async function GET() {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [row] = await db<ChatbotSettings[]>`
    SELECT chatbot_enabled FROM app_settings WHERE id = 1
  `;
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const body = await req.json();
  const enabled = !!body.chatbot_enabled;

  const [row] = await db<ChatbotSettings[]>`
    UPDATE app_settings SET chatbot_enabled = ${enabled}
    WHERE id = 1
    RETURNING chatbot_enabled
  `;
  return NextResponse.json(row);
}
