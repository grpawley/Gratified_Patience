"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCents, getTotalSaved } from "@/lib/savings";
import type { Database } from "@/types/database";

type Decision = Database["public"]["Tables"]["decisions"]["Row"];
type Want = Database["public"]["Tables"]["wants"]["Row"];

interface DecisionWithWant extends Decision {
  want: Want & { savings_entries: { amount_cents: number }[] };
}

const outcomeLabels = {
  bought: "Bought with intention",
  extended: "Extended the wait",
  walked_away: "Walked away",
};

const outcomeColors = {
  bought: "text-[#7C9A82]",
  extended: "text-[#C4956A]",
  walked_away: "text-[#B8C4B8]",
};

export default function HistoryPage() {
  const [decisions, setDecisions] = useState<DecisionWithWant[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("decisions")
      .select("*, want:wants(*, savings_entries(amount_cents))")
      .order("decided_at", { ascending: false })
      .then(({ data }) => {
        setDecisions((data as DecisionWithWant[]) ?? []);
        setLoading(false);
      });
  }, [supabase]);

  if (loading) {
    return <div className="p-6 space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-[#FAF7F2] rounded-xl animate-pulse" />)}
    </div>;
  }

  const walkedAwaySavings = decisions
    .filter((d) => d.outcome === "walked_away")
    .reduce((sum, d) => sum + getTotalSaved(d.want.savings_entries), 0);

  const grouped = {
    bought: decisions.filter((d) => d.outcome === "bought"),
    extended: decisions.filter((d) => d.outcome === "extended"),
    walked_away: decisions.filter((d) => d.outcome === "walked_away"),
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-light text-[#3D3D3D]">History</h1>
        {walkedAwaySavings > 0 && (
          <p className="text-sm text-[#B8C4B8] mt-1">
            {formatCents(walkedAwaySavings)} kept for what matters
          </p>
        )}
      </div>

      {decisions.length === 0 && (
        <p className="text-[#B8C4B8]">No decisions yet. Your history will appear here.</p>
      )}

      {(["bought", "walked_away", "extended"] as const).map((outcome) => {
        const group = grouped[outcome];
        if (group.length === 0) return null;
        return (
          <div key={outcome} className="space-y-3">
            <h2 className={`text-sm font-medium ${outcomeColors[outcome]}`}>
              {outcomeLabels[outcome]}
            </h2>
            <div className="space-y-2">
              {group.map((d) => (
                <Link key={d.id} href={`/wants/${d.want_id}`}>
                  <div className="rounded-xl bg-[#FAF7F2] border border-[#B8C4B8]/30 p-4 hover:border-[#7C9A82]/40 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[#3D3D3D]">{d.want.name}</p>
                        <p className="text-sm text-[#B8C4B8] mt-0.5">
                          {formatCents(d.want.price_cents)} ·{" "}
                          saved {formatCents(getTotalSaved(d.want.savings_entries))}
                        </p>
                      </div>
                      <p className="text-xs text-[#B8C4B8]">
                        {format(new Date(d.decided_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    {d.reflection && (
                      <p className="text-sm text-[#3D3D3D] mt-2 italic border-t border-[#B8C4B8]/20 pt-2">
                        &ldquo;{d.reflection}&rdquo;
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
