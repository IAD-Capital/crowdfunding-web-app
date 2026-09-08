export const UNIT_PRICE_STAGES = [
  { value: "pozo", label: "Pozo" },
  { value: "preventa", label: "Preventa" },
  { value: "construccion", label: "En construcción" },
  { value: "terminado", label: "Terminado / Entrega" },
] as const;

export function unitPriceStageLabel(stage: string): string {
  return UNIT_PRICE_STAGES.find((s) => s.value === stage)?.label ?? stage;
}
