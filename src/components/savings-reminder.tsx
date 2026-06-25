"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCents } from "@/lib/savings";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
type Want = Database["public"]["Tables"]["wants"]["Row"];

interface SavingsReminderProps {
  reminder: Reminder;
  want: Want;
  onDismissed: () => void;
}

export function SavingsReminder({ reminder, want, onDismissed }: SavingsReminderProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleDismiss() {
    setLoading(true);
    await supabase
      .from("reminders")
      .update({ responded_at: new Date().toISOString() })
      .eq("id", reminder.id);
    setLoading(false);
    onDismissed();
  }

  return (
    <div className="rounded-xl bg-[#7C9A82]/10 border border-[#7C9A82]/30 p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-[#3D3D3D]">
          Time to set aside{" "}
          <span className="text-[#7C9A82]">
            {formatCents(want.contribution_amount_cents)}
          </span>{" "}
          for {want.name}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleDismiss}
        disabled={loading}
      >
        Got it
      </Button>
    </div>
  );
}
