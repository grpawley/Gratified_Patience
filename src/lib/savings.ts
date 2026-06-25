import type { SavingsFrequency } from "@/types/database";

export function calculateContribution(
  priceCents: number,
  waitingDays: number,
  frequency: SavingsFrequency
): number {
  const periodsInDays: Record<SavingsFrequency, number> = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30.44,
  };
  const periodDays = periodsInDays[frequency];
  const periods = Math.ceil(waitingDays / periodDays);
  if (periods <= 0) return priceCents;
  return Math.ceil(priceCents / periods);
}

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function parseDollars(dollars: string): number {
  const cleaned = dollars.replace(/[^0-9.]/g, "");
  return Math.round(parseFloat(cleaned || "0") * 100);
}

export function getTotalSaved(entries: { amount_cents: number }[]): number {
  return entries.reduce((sum, e) => sum + e.amount_cents, 0);
}

export function getSavingsProgress(savedCents: number, priceCents: number): number {
  if (priceCents <= 0) return 0;
  return Math.min(100, (savedCents / priceCents) * 100);
}
