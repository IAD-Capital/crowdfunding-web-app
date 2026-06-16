import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    await db`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "connected" });
  } catch (err) {
    return NextResponse.json(
      { status: "error", db: "unreachable", message: String(err) },
      { status: 500 }
    );
  }
}
