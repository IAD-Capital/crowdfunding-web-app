import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import getWebpush from "@/lib/webpush";
import { requireSuperAdmin } from "@/lib/requireAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Subscription = { endpoint: string; p256dh: string; auth: string };

export async function POST(req: NextRequest) {
  const { error, session } = await requireSuperAdmin();
  if (error) return error;

  const { title, body, url } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title y body son obligatorios" }, { status: 400 });
  }

  try {
    const subs = await db<Subscription[]>`SELECT endpoint, p256dh, auth FROM push_subscriptions`;
    const webpush = getWebpush();

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title, body, url: url || undefined })
          )
          .catch(async (err) => {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await db`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
            }
            throw err;
          })
      )
    );

    const success = results.filter((r) => r.status === "fulfilled").length;
    const failure = results.length - success;

    await db`
      INSERT INTO push_notifications (title, body, url, sent_by, recipient_count, success_count, failure_count)
      VALUES (${title}, ${body}, ${url || null}, ${session!.sub}, ${subs.length}, ${success}, ${failure})
    `;

    return NextResponse.json({ sent: success, failed: failure, total: subs.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
