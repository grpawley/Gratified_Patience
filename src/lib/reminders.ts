import { generateSavingsDates, generateEnthusiasmDates } from "./dates";
import { ENTHUSIASM_PROMPTS } from "./constants";
import type { Database, SavingsFrequency } from "@/types/database";

type ReminderInsert = Database["public"]["Tables"]["reminders"]["Insert"];

interface WantForReminders {
  id: string;
  user_id: string;
  started_at: string;
  ends_at: string;
  savings_frequency: SavingsFrequency;
  savings_reminder_frequency: SavingsFrequency;
  contribution_amount_cents: number;
  enthusiasm_reminder_min_days: number;
  enthusiasm_reminder_max_days: number;
}

function randomPrompt(): string {
  return ENTHUSIASM_PROMPTS[Math.floor(Math.random() * ENTHUSIASM_PROMPTS.length)];
}

export function generateSavingsReminders(want: WantForReminders): ReminderInsert[] {
  const dates = generateSavingsDates(
    want.started_at,
    want.ends_at,
    want.savings_reminder_frequency
  );
  return dates.map((date) => ({
    want_id: want.id,
    user_id: want.user_id,
    type: "savings" as const,
    prompt: `Time to set aside money for this want.`,
    scheduled_for: date.toISOString(),
  }));
}

export function generateEnthusiasmReminders(want: WantForReminders): ReminderInsert[] {
  const dates = generateEnthusiasmDates(
    want.started_at,
    want.ends_at,
    want.enthusiasm_reminder_min_days,
    want.enthusiasm_reminder_max_days
  );
  return dates.map((date) => ({
    want_id: want.id,
    user_id: want.user_id,
    type: "enthusiasm" as const,
    prompt: randomPrompt(),
    scheduled_for: date.toISOString(),
  }));
}

export function generateAllReminders(want: WantForReminders): ReminderInsert[] {
  return [
    ...generateSavingsReminders(want),
    ...generateEnthusiasmReminders(want),
  ];
}
