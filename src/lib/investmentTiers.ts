export type TierThresholds = {
  silver_from: number;
  gold_from: number;
  platinum_from: number;
};

export type TierKey = "bronze" | "silver" | "gold" | "platinum";

export type TierDef = {
  key: TierKey;
  label: string;
  from: number;
  to: number | null; // null = sin tope (Platino)
};

export function getTierDefs(thresholds: TierThresholds): TierDef[] {
  return [
    { key: "bronze", label: "Bronce", from: 0, to: thresholds.silver_from },
    { key: "silver", label: "Plata", from: thresholds.silver_from, to: thresholds.gold_from },
    { key: "gold", label: "Oro", from: thresholds.gold_from, to: thresholds.platinum_from },
    { key: "platinum", label: "Platino", from: thresholds.platinum_from, to: null },
  ];
}

/**
 * A unit qualifies for a tier if the dollar range a user could actually
 * invest in it (from the 5% minimum entry up to whatever's still available)
 * overlaps the tier's [from, to) range. Platino additionally requires the
 * unit to be 100% available, since it represents buying the whole UF.
 */
export function unitQualifiesForTier(
  unit: { price_usd: number; available_pct?: number },
  tier: TierDef
): boolean {
  const availablePct = unit.available_pct ?? 100;
  const minInvest = unit.price_usd * 0.05;
  const maxInvest = unit.price_usd * (availablePct / 100);

  if (tier.key === "platinum") {
    return availablePct >= 100 && unit.price_usd >= tier.from;
  }

  const to = tier.to ?? Infinity;
  return maxInvest >= tier.from && minInvest < to;
}
