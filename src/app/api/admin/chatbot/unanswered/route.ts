import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export async function GET(req: NextRequest) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const status = req.nextUrl.searchParams.get("status");

  const rows = status
    ? await db`
        SELECT * FROM chatbot_unanswered_questions
        WHERE status = ${status}
        ORDER BY created_at DESC
      `
    : await db`
        SELECT * FROM chatbot_unanswered_questions
        ORDER BY created_at DESC
      `;

  return NextResponse.json(rows);
}
