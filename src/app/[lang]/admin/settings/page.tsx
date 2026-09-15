import db from "@/lib/db";
import InvestmentTiersForm from "@/components/admin/InvestmentTiersForm";
import ComingSoonSettingsForm from "@/components/admin/ComingSoonSettingsForm";
import ChatbotSettingsForm from "@/components/admin/ChatbotSettingsForm";
import InstallAppSettingsForm from "@/components/admin/InstallAppSettingsForm";
import EmailTestForm, { type EmailTestUser } from "@/components/admin/EmailTestForm";
import type { TierThresholds } from "@/lib/investmentTiers";

export default async function AdminSettingsPage() {
  // SELECT * so this page keeps working even before migrations 008/017 have
  // added chatbot_enabled/install_app_enabled — the toggles just default to
  // enabled in that case.
  const [[row], users] = await Promise.all([
    db<
      (TierThresholds & {
        coming_soon_enabled: boolean;
        coming_soon_expires_at: string | null;
        chatbot_enabled?: boolean;
        install_app_enabled?: boolean;
      })[]
    >`SELECT * FROM app_settings WHERE id = 1`,
    db<EmailTestUser[]>`SELECT id, full_name, email FROM users ORDER BY full_name`,
  ]);

  const thresholds: TierThresholds = row
    ? {
        bronze_from: Number(row.bronze_from),
        silver_from: Number(row.silver_from),
        gold_from: Number(row.gold_from),
        platinum_from: Number(row.platinum_from),
      }
    : { bronze_from: 5000, silver_from: 10000, gold_from: 25000, platinum_from: 150000 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "-0.5rem" }}>Configuración</h1>
      <ComingSoonSettingsForm
        initialEnabled={row?.coming_soon_enabled ?? false}
        initialExpiresAt={row?.coming_soon_expires_at ?? null}
      />
      <ChatbotSettingsForm initialEnabled={row?.chatbot_enabled ?? true} />
      <InstallAppSettingsForm initialEnabled={row?.install_app_enabled ?? true} />
      <EmailTestForm users={users} senderEmail={process.env.MAIL_USER ?? "iadcapital.app@gmail.com"} />
      <InvestmentTiersForm initial={thresholds} />
    </div>
  );
}
