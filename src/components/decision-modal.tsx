"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createClient } from "@/lib/supabase/client";
import { formatCents } from "@/lib/savings";
import { Button } from "@/components/ui/button";
import type { WantWithSavings } from "@/hooks/use-wants";
import { addDays } from "date-fns";

interface DecisionModalProps {
  want: WantWithSavings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecided: () => void;
}

type Outcome = "bought" | "extended" | "walked_away";

export function DecisionModal({ want, open, onOpenChange, onDecided }: DecisionModalProps) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [reflection, setReflection] = useState("");
  const [extensionWeeks, setExtensionWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleDecide() {
    if (!outcome) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const extendedUntil =
      outcome === "extended"
        ? addDays(new Date(), extensionWeeks * 7).toISOString()
        : null;

    await supabase.from("decisions").insert({
      want_id: want.id,
      user_id: user.id,
      outcome,
      reflection: reflection || null,
      extended_until: extendedUntil,
    });

    await supabase
      .from("wants")
      .update({
        status: "decided",
        ...(outcome === "extended" ? { ends_at: extendedUntil! } : {}),
      })
      .eq("id", want.id);

    setLoading(false);
    onOpenChange(false);
    onDecided();
  }

  const outcomeMessages: Record<Outcome, string> = {
    bought: "You chose this with intention.",
    extended: "Give it more time.",
    walked_away: `You saved ${formatCents(want.total_saved_cents)} and learned something.`,
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#FAF7F2] rounded-2xl p-6 shadow-xl space-y-6">
          <Dialog.Title className="text-xl font-light text-[#3D3D3D]">
            Your decision
          </Dialog.Title>

          <div className="rounded-lg bg-white border border-[#B8C4B8]/30 p-4">
            <p className="font-medium text-[#3D3D3D]">{want.name}</p>
            <p className="text-sm text-[#B8C4B8] mt-1">
              {formatCents(want.price_cents)} · Saved {formatCents(want.total_saved_cents)}
            </p>
          </div>

          <div className="space-y-2">
            {(["bought", "extended", "walked_away"] as Outcome[]).map((o) => (
              <button
                key={o}
                onClick={() => setOutcome(o)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  outcome === o
                    ? "border-[#7C9A82] bg-[#7C9A82]/10"
                    : "border-[#B8C4B8]/30 hover:border-[#7C9A82]/50"
                }`}
              >
                <p className="font-medium text-[#3D3D3D]">
                  {o === "bought" && "I'll take it"}
                  {o === "extended" && "Not yet — give me more time"}
                  {o === "walked_away" && "I'll pass"}
                </p>
                {outcome === o && (
                  <p className="text-sm text-[#7C9A82] mt-1">{outcomeMessages[o]}</p>
                )}
              </button>
            ))}
          </div>

          {outcome === "extended" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[#3D3D3D]">Extend by (weeks)</label>
              <input
                type="number"
                min={1}
                value={extensionWeeks}
                onChange={(e) => setExtensionWeeks(Number(e.target.value))}
                className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
              />
            </div>
          )}

          <textarea
            rows={2}
            placeholder="Reflection (optional)"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-sm text-[#3D3D3D] placeholder:text-[#B8C4B8] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
          />

          <div className="flex gap-3">
            <Button onClick={handleDecide} disabled={!outcome || loading} className="flex-1">
              {loading ? "Saving..." : "Confirm"}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
