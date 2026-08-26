import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireAdmin } from "@/lib/requireAdmin";
import { sendMail, getAppUrl, renderEmail } from "@/lib/mail";
import { DEFAULT_LOCALE } from "@/i18n";

const NOTIFY_EMAIL = "iadcapital.app@gmail.com";

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  if (session!.role !== "investor") {
    return NextResponse.json({ error: "Solo los inversores pueden comprar participaciones." }, { status: 403 });
  }

  const [user] = await db`SELECT phone FROM users WHERE id = ${session!.sub}`;
  if (!user?.phone?.trim()) {
    return NextResponse.json(
      { error: "Necesitás cargar tu número de teléfono en tu perfil antes de invertir." },
      { status: 400 }
    );
  }

  const { unit_id, percentage } = await req.json();

  // Slider: 5–50 step 5. Fixed amount: any value >= 5. Platinum: exactly 100.
  const validPct = (percentage >= 5 && percentage <= 100);
  if (!unit_id || !percentage || !validPct) {
    return NextResponse.json({ error: "Porcentaje inválido. Debe ser entre 5% y 100%." }, { status: 400 });
  }

  // An investor can't have a pending request or an already-approved investment in the same unit
  const [existing] = await db`
    SELECT id FROM investments
    WHERE unit_id = ${unit_id} AND user_id = ${session!.sub} AND status IN ('pending', 'approved')
  `;
  if (existing) {
    return NextResponse.json(
      { error: "Ya tenés una solicitud pendiente o una inversión aprobada en esta unidad." },
      { status: 409 }
    );
  }

  const [unit] = await db`
    SELECT u.price_usd, u.status, u.identifier, d.name AS development_name
    FROM units u
    JOIN developments d ON d.id = u.development_id
    WHERE u.id = ${unit_id}
  `;
  if (!unit) return NextResponse.json({ error: "Unidad no encontrada." }, { status: 404 });
  if (unit.status === "sold") return NextResponse.json({ error: "Unidad ya vendida." }, { status: 409 });

  // Only approved investments count against the unit's availability.
  // Platinum (100%) proposals are always allowed — they supersede existing investors upon approval.
  if (Number(percentage) < 100) {
    const [agg] = await db`
      SELECT COALESCE(SUM(percentage), 0)::numeric AS sold_pct
      FROM investments
      WHERE unit_id = ${unit_id} AND status = 'approved'
    `;
    const soldPct = Number(agg.sold_pct);
    if (soldPct + Number(percentage) > 100) {
      return NextResponse.json(
        { error: `Solo queda ${100 - soldPct}% disponible en esta unidad.` },
        { status: 409 }
      );
    }
  }

  const amount_usd = (Number(unit.price_usd) * Number(percentage)) / 100;

  const [inv] = await db`
    INSERT INTO investments (user_id, unit_id, percentage, amount_usd, status)
    VALUES (${session!.sub}, ${unit_id}, ${percentage}, ${amount_usd}, 'pending')
    RETURNING *
  `;

  const dashboardUrl = `${getAppUrl()}/${DEFAULT_LOCALE}/admin/investments#investment-${inv.id}`;
  await sendMail({
    to: NOTIFY_EMAIL,
    subject: `Nueva inversión: ${session!.fullName} — ${unit.development_name} (${unit.identifier})`,
    html: renderEmail(`
      <p><strong>${session!.fullName}</strong> (${session!.email}) invirtió <strong>${percentage}%</strong> en <strong>${unit.identifier}</strong>, ${unit.development_name}.</p>
      <p>Monto: USD ${amount_usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</p>
      <p><a href="${dashboardUrl}">Ver inversión en el dashboard</a></p>
    `),
  });

  const walletUrl = `${getAppUrl()}/${DEFAULT_LOCALE}/wallet`;
  await sendMail({
    to: session!.email,
    subject: `Recibimos tu solicitud de inversión — ${unit.identifier}, ${unit.development_name}`,
    html: renderEmail(`
      <p>Hola ${session!.fullName},</p>
      <p>Recibimos tu solicitud de inversión del <strong>${percentage}%</strong> en <strong>${unit.identifier}</strong>, ${unit.development_name}, por <strong>USD ${amount_usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong>.</p>
      <p>Tu inversión quedará confirmada una vez que sea aprobada.</p>
      <p><a href="${walletUrl}">Ver mi cartera</a></p>
    `),
  });

  return NextResponse.json(inv, { status: 201 });
}
