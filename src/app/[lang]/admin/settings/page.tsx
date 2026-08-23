import db from "@/lib/db";
import InvestmentTiersForm from "@/components/admin/InvestmentTiersForm";
import ComingSoonSettingsForm from "@/components/admin/ComingSoonSettingsForm";
import ChatbotSettingsForm from "@/components/admin/ChatbotSettingsForm";
import type { TierThresholds } from "@/lib/investmentTiers";

export default async function AdminSettingsPage() {
  // SELECT * so this page keeps working even before migration 008 has added
  // chatbot_enabled — the toggle just defaults to enabled in that case.
  const [row] = await db<
    (TierThresholds & { coming_soon_enabled: boolean; coming_soon_expires_at: string | null; chatbot_enabled?: boolean })[]
  >`
    SELECT * FROM app_settings WHERE id = 1
  `;

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
      <InvestmentTiersForm initial={thresholds} />
    </div>
  );
}
