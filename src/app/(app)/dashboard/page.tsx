"use client";

import Link from "next/link";
import { useWants } from "@/hooks/use-wants";
import { usePendingReminders } from "@/hooks/use-reminders";
import { WantCard } from "@/components/want-card";
import { SavingsReminder } from "@/components/savings-reminder";
import { EnthusiasmPrompt } from "@/components/enthusiasm-prompt";
import { Button } from "@/components/ui/button";
import { formatCents, getTotalSaved } from "@/lib/savings";
import { getWantsReadyForDecision } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { Database } from "@/types/database";

type Want = Database["public"]["Tables"]["wants"]["Row"];

export default function DashboardPage() {
  const { wants, loading, refetch } = useWants();
  const { reminders, refetch: refetchReminders } = usePendingReminders();
  const [wantsMap, setWantsMap] = useState<Record<string, Want>>({});
  const supabase = createClient();

  useEffect(() => {
    if (reminders.length > 0) {
      const ids = [...new Set(reminders.map((r) => r.want_id))];
      supabase
        .from("wants")
        .select("*")
        .in("id", ids)
        .then(({ data }) => {
          if (data) {
            const map: Record<string, Want> = {};
            data.forEach((w) => (map[w.id] = w));
            setWantsMap(map);
          }
        });
    }
  }, [reminders, supabase]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-[#FAF7F2] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const activeWants = wants.filter((w) => w.status === "active");
  const readyWants = getWantsReadyForDecision(activeWants);
  const waitingWants = activeWants.filter((w) => !readyWants.some((r) => r.id === w.id));
  const totalSaved = getTotalSaved(wants.flatMap((w) => w.savings_entries));
  const totalPrice = wants.reduce((sum, w) => sum + w.price_cents, 0);

  const savingsReminders = reminders.filter((r) => r.type === "savings");
  const enthusiasmReminders = reminders.filter((r) => r.type === "enthusiasm");

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Summary */}
      {wants.length > 0 && (
        <div className="rounded-xl bg-[#FAF7F2] border border-[#B8C4B8]/30 p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-light text-[#3D3D3D]">{activeWants.length}</p>
              <p className="text-xs text-[#B8C4B8] mt-0.5">active wants</p>
            </div>
            <div>
              <p className="text-2xl font-light text-[#7C9A82]">{formatCents(totalSaved)}</p>
              <p className="text-xs text-[#B8C4B8] mt-0.5">saved</p>
            </div>
            <div>
              <p className="text-2xl font-light text-[#3D3D3D]">{formatCents(totalPrice)}</p>
              <p className="text-xs text-[#B8C4B8] mt-0.5">total</p>
            </div>
          </div>
        </div>
      )}

      {/* Reminders */}
      {enthusiasmReminders.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[#B8C4B8]">A reflection is waiting</p>
          {enthusiasmReminders.slice(0, 1).map((r) => (
            <EnthusiasmPrompt
              key={r.id}
              reminder={r}
              wantName={wantsMap[r.want_id]?.name ?? "your want"}
              onResponded={refetchReminders}
            />
          ))}
        </div>
      )}

      {savingsReminders.length > 0 && (
        <div className="space-y-2">
          {savingsReminders.slice(0, 3).map((r) => {
            const want = wantsMap[r.want_id];
            if (!want) return null;
            return (
              <SavingsReminder
                key={r.id}
                reminder={r}
                want={want}
                onDismissed={refetchReminders}
              />
            );
          })}
        </div>
      )}

      {/* Ready to decide */}
      {readyWants.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[#C4956A]">Ready for your decision</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {readyWants.map((w) => (
              <WantCard key={w.id} want={w} />
            ))}
          </div>
        </div>
      )}

      {/* Active wants */}
      {waitingWants.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[#3D3D3D]">Your wants</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {waitingWants.map((w) => (
              <WantCard key={w.id} want={w} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {wants.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <p className="text-2xl font-light text-[#3D3D3D]">Nothing here yet.</p>
          <p className="text-[#B8C4B8]">
            When you see something you want, log it here instead of buying it.
          </p>
          <Link href="/wants/new">
            <Button size="lg" className="mt-4">Log your first want</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
