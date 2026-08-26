import db from "@/lib/db";
import type { Locale } from "@/i18n";
import type { Notification } from "@/components/NotificationBell";

export async function getAdminAlerts(lang: Locale): Promise<Notification[]> {
  const [removalRows, pendingRows, chatbotRows] = await Promise.all([
    db`
      SELECT i.id, i.removal_requested_at,
        u.identifier, d.name AS development_name, usr.full_name
      FROM investments i
      JOIN units u ON u.id = i.unit_id
      JOIN developments d ON d.id = u.development_id
      JOIN users usr ON usr.id = i.user_id
      WHERE i.removal_requested_at IS NOT NULL AND i.status = 'approved'
      ORDER BY i.removal_requested_at ASC
    `,
    db`
      SELECT i.id, i.percentage, i.created_at,
        u.identifier, d.name AS development_name, usr.full_name
      FROM investments i
      JOIN units u ON u.id = i.unit_id
      JOIN developments d ON d.id = u.development_id
      JOIN users usr ON usr.id = i.user_id
      WHERE i.status = 'pending'
      ORDER BY i.created_at ASC
    `,
    db`
      SELECT id, question, created_at
      FROM chatbot_unanswered_questions
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `,
  ]);

  const pending: Notification[] = pendingRows.map((r) => ({
    id: `pending-${r.id}`,
    title: "Solicitud de inversión pendiente",
    body: `${r.full_name} quiere invertir ${Number(r.percentage)}% en ${r.identifier} (${r.development_name})`,
    href: `/${lang}/admin/investments`,
    timestamp: new Date(r.created_at as string).toISOString(),
    variant: "pending" as const,
    actions: [
      { label: "Aprobar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { status: "approved" }, variant: "primary" as const },
      { label: "Rechazar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { status: "rejected" }, variant: "ghost" as const },
    ],
  }));

  const removals: Notification[] = removalRows.map((r) => ({
    id: `removal-${r.id}`,
    title: "Solicitud de remoción",
    body: `${r.full_name} solicitó remover su inversión en ${r.identifier} (${r.development_name})`,
    href: `/${lang}/admin/investments`,
    timestamp: new Date(r.removal_requested_at as string).toISOString(),
    variant: "warning" as const,
    actions: [
      { label: "Aprobar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { status: "cancelled" }, variant: "danger" as const },
      { label: "Rechazar", url: `/api/admin/investments/${r.id}`, method: "PUT" as const, body: { clear_removal_request: true }, variant: "ghost" as const },
    ],
  }));

  const chatbot: Notification[] = chatbotRows.map((r) => ({
    id: `chatbot-${r.id}`,
    title: "Nueva pregunta sin responder",
    body: r.question,
    href: `/${lang}/admin/chatbot/unanswered`,
    timestamp: new Date(r.created_at as string).toISOString(),
    variant: "info" as const,
  }));

  return [...pending, ...removals, ...chatbot];
}
