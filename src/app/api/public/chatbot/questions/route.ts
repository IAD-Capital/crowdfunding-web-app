import { NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db`
    SELECT id, parent_id, question, answer FROM chatbot_questions
    WHERE is_active = true
    ORDER BY sort_order, id
  `;
  return NextResponse.json(rows);
}
