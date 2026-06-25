import { differenceInDays, isPast, addDays, addWeeks, addMonths, addHours } from "date-fns";

export function getTimeProgress(startedAt: string, endsAt: string): number {
  const start = new Date(startedAt);
  const end = new Date(endsAt);
  const now = new Date();
  const total = differenceInDays(end, start);
  const elapsed = differenceInDays(now, start);
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

export function getDaysRemaining(endsAt: string): number {
  return Math.max(0, differenceInDays(new Date(endsAt), new Date()));
}

export function isWaitingPeriodComplete(endsAt: string): boolean {
  return isPast(new Date(endsAt));
}

export function computeEndsAt(startedAt: string, waitingDays: number): Date {
  return addDays(new Date(startedAt), waitingDays);
}

export function nextSavingsDate(
  from: Date,
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
): Date {
  switch (frequency) {
    case "daily": return addDays(from, 1);
    case "weekly": return addWeeks(from, 1);
    case "biweekly": return addWeeks(from, 2);
    case "monthly": return addMonths(from, 1);
  }
}

export function generateSavingsDates(
  startedAt: string,
  endsAt: string,
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
): Date[] {
  const dates: Date[] = [];
  let current = nextSavingsDate(new Date(startedAt), frequency);
  const end = new Date(endsAt);
  while (current <= end) {
    dates.push(current);
    current = nextSavingsDate(current, frequency);
  }
  return dates;
}

export function generateEnthusiasmDates(
  startedAt: string,
  endsAt: string,
  minDays: number,
  maxDays: number
): Date[] {
  const dates: Date[] = [];
  let current = new Date(startedAt);
  const end = new Date(endsAt);
  // Add some initial offset jitter
  const initialOffset = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
  current = addDays(current, initialOffset);
  while (current <= end) {
    dates.push(current);
    const interval = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    current = addDays(current, interval);
  }
  return dates;
}

export function getWantsReadyForDecision<T extends { ends_at: string; status: string }>(
  wants: T[]
): T[] {
  return wants.filter(
    (w) => w.status === "active" && isWaitingPeriodComplete(w.ends_at)
  );
}
