import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

type SubscribeBody = {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  userAgent?: string;
};

export async function POST(req: NextRequest) {
  const { subscription, userAgent }: SubscribeBody = await req.json();

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const session = await getSession();

  try {
    await db`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
      VALUES (${session?.sub ?? null}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth}, ${userAgent ?? null})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        last_seen_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
