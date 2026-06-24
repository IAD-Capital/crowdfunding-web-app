import db from "@/lib/db";
import InvestmentTiersForm from "@/components/admin/InvestmentTiersForm";
import type { TierThresholds } from "@/lib/investmentTiers";

export default async function AdminSettingsPage() {
  const [row] = await db<TierThresholds[]>`
    SELECT silver_from, gold_from, platinum_from FROM app_settings WHERE id = 1
  `;

  const thresholds: TierThresholds = row
    ? {
        silver_from: Number(row.silver_from),
        gold_from: Number(row.gold_from),
        platinum_from: Number(row.platinum_from),
      }
    : { silver_from: 10000, gold_from: 25000, platinum_from: 150000 };

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Configuración</h1>
      <InvestmentTiersForm initial={thresholds} />
    </div>
  );
}
