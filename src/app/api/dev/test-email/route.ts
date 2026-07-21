import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const to = req.nextUrl.searchParams.get("to");
  if (!to) {
    return NextResponse.json({ error: "Missing ?to=<email> query param" }, { status: 400 });
  }

  await sendMail({
    to,
    subject: "Test email — Binova dev",
    html: `<p>This is a test email sent from the dev endpoint at ${new Date().toISOString()}.</p>`,
  });

  return NextResponse.json({
    status: "ok",
    to,
    resendConfigured: !!process.env.RESEND_API_KEY,
  });
}
