"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { formatCents, parseDollars } from "@/lib/savings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/database";
import { PlusCircle } from "lucide-react";

type SavingsEntry = Database["public"]["Tables"]["savings_entries"]["Row"];

const schema = z.object({
  amount: z.string().min(1, "Amount is required"),
  note: z.string().optional(),
});

interface SavingsLogProps {
  wantId: string;
  entries: SavingsEntry[];
  onLogged: () => void;
}

export function SavingsLog({ wantId, entries, onLogged }: SavingsLogProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ amount: string; note?: string }>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: { amount: string; note?: string }) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("savings_entries").insert({
      want_id: wantId,
      user_id: user.id,
      amount_cents: parseDollars(data.amount),
      note: data.note || null,
    });

    reset();
    setShowForm(false);
    setLoading(false);
    onLogged();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[#3D3D3D]">Savings log</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusCircle size={16} className="mr-1" />
          Log contribution
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border border-[#B8C4B8]/30 bg-[#FAF7F2] p-4 space-y-3">
          <Input
            id="amount"
            label="Amount ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register("amount")}
          />
          <Input
            id="note"
            label="Note (optional)"
            placeholder="Weekly contribution"
            {...register("note")}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-[#B8C4B8]">No contributions logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries
            .slice()
            .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
            .map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between py-2 border-b border-[#B8C4B8]/20 last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-[#3D3D3D]">
                    {formatCents(entry.amount_cents)}
                  </span>
                  {entry.note && (
                    <p className="text-xs text-[#B8C4B8]">{entry.note}</p>
                  )}
                </div>
                <span className="text-xs text-[#B8C4B8]">
                  {format(new Date(entry.logged_at), "MMM d")}
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
