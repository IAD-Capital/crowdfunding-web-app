import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSuperAdmin } from "@/lib/requireAdmin";
import { sendMail, getAppUrl, renderEmail } from "@/lib/mail";
import { DEFAULT_LOCALE } from "@/i18n";

type Ctx = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const { status, percentage, amount_usd, clear_removal_request } = await req.json();

  const [before] = await db`SELECT status FROM investments WHERE id = ${params.id}`;
  const wasApproved = before?.status === "approved";

  // Approving an investment: check availability, then handle platinum (100%) takeover.
  if (status === "approved") {
    const [current] = await db`SELECT unit_id, user_id, percentage FROM investments WHERE id = ${params.id}`;
    if (current) {
      const [conflict] = await db`
        SELECT id FROM investments
        WHERE unit_id = ${current.unit_id}
          AND user_id = ${current.user_id}
          AND status = 'approved'
          AND id != ${params.id}
      `;
      if (conflict) {
        return NextResponse.json(
          { error: "Este inversor ya tiene una inversión aprobada en esta unidad." },
          { status: 409 }
        );
      }

      const pct = percentage != null ? Number(percentage) : Number(current.percentage);

      if (pct >= 100) {
        // Platinum takeover: cancel all other investments in this unit before approving
        await db`
          UPDATE investments SET status = 'cancelled'
          WHERE unit_id = ${current.unit_id}
            AND id != ${params.id}
            AND status IN ('pending', 'approved')
        `;
      } else {
        const [agg] = await db`
          SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
          FROM investments WHERE unit_id = ${current.unit_id} AND status = 'approved' AND id != ${params.id}
        `;
        const soldPct = Number(agg.sold_pct);
        if (soldPct + pct > 100) {
          return NextResponse.json(
            { error: `Solo queda ${100 - soldPct}% disponible en esta unidad.` },
            { status: 409 }
          );
        }
      }
    }
  }

  const [row] = await db`
    UPDATE investments SET
      status                = COALESCE(${status ?? null}, status),
      percentage            = COALESCE(${percentage ?? null}, percentage),
      amount_usd            = COALESCE(${amount_usd ?? null}, amount_usd),
      removal_requested_at  = CASE WHEN ${!!clear_removal_request} THEN NULL ELSE removal_requested_at END
    WHERE id = ${params.id}
    RETURNING *
  `;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate unit status after update
  const [agg] = await db`
    SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
    FROM investments WHERE unit_id = ${row.unit_id} AND status = 'approved'
  `;
  const sold = Number(agg.sold_pct);
  const unitStatus = sold >= 100 ? "sold" : sold > 0 ? "partial" : "available";
  await db`UPDATE units SET status = ${unitStatus} WHERE id = ${row.unit_id}`;

  if (row.status === "approved" && !wasApproved) {
    const [investor] = await db`SELECT full_name, email FROM users WHERE id = ${row.user_id}`;
    const [unit] = await db`
      SELECT un.identifier, d.name AS development_name
      FROM units un
      JOIN developments d ON d.id = un.development_id
      WHERE un.id = ${row.unit_id}
    `;
    const details = investor && unit ? { ...investor, ...unit } : null;
    if (details) {
      const walletUrl = `${getAppUrl()}/${DEFAULT_LOCALE}/wallet`;
      await sendMail({
        to: details.email,
        subject: `¡Tu inversión fue aprobada! — ${details.identifier}, ${details.development_name}`,
        html: renderEmail(`
          <p>Hola ${details.full_name},</p>
          <p>¡Buenas noticias! Tu inversión del <strong>${Number(row.percentage)}%</strong> en <strong>${details.identifier}</strong>, ${details.development_name}, por <strong>USD ${Number(row.amount_usd).toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>, fue aprobada.</p>
          <p><strong>Próximos pasos:</strong></p>
          <ol>
            <li>Nuestro equipo se va a contactar con vos para coordinar una reunión presencial.</li>
            <li>En la reunión te vamos a aclarar todas las dudas que tengas.</li>
            <li>Formalizamos la inversión con una seña.</li>
            <li>Una vez formalizada, vas a poder seguir el estado y el rendimiento de tu inversión desde tu cartera.</li>
          </ol>
          <p><a href="${walletUrl}">Ver mi cartera</a></p>
        `),
      });
    }
  }

  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireSuperAdmin();
  if (error) return error;

  const [inv] = await db`DELETE FROM investments WHERE id = ${params.id} RETURNING unit_id`;
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Recalculate unit status
  const [agg] = await db`
    SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
    FROM investments WHERE unit_id = ${inv.unit_id} AND status = 'approved'
  `;
  const sold = Number(agg.sold_pct);
  const unitStatus = sold >= 100 ? "sold" : sold > 0 ? "partial" : "available";
  await db`UPDATE units SET status = ${unitStatus} WHERE id = ${inv.unit_id}`;

  return NextResponse.json({ ok: true });
}
