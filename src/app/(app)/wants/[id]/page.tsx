"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useWant } from "@/hooks/use-wants";
import { useRemindersForWant } from "@/hooks/use-reminders";
import { ProgressBar } from "@/components/progress-bar";
import { SavingsLog } from "@/components/savings-log";
import { DecisionModal } from "@/components/decision-modal";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/savings";
import { getTimeProgress, getDaysRemaining, isWaitingPeriodComplete } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { Trash2, ExternalLink } from "lucide-react";

// Re-export from dates
function getSavProg(saved: number, price: number) {
  if (price <= 0) return 0;
  return Math.min(100, (saved / price) * 100);
}

export default function WantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { want, loading, refetch } = useWant(id);
  const { reminders } = useRemindersForWant(id);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  if (loading) {
    return <div className="p-6 animate-pulse space-y-4">
      <div className="h-8 bg-[#FAF7F2] rounded w-48" />
      <div className="h-32 bg-[#FAF7F2] rounded" />
    </div>;
  }

  if (!want) {
    return <div className="p-6"><p className="text-[#B8C4B8]">Want not found.</p></div>;
  }

  const timeProgress = getTimeProgress(want.started_at, want.ends_at);
  const savingsProgress = getSavProg(want.total_saved_cents, want.price_cents);
  const isReady = isWaitingPeriodComplete(want.ends_at);
  const isDecided = want.status === "decided";

  async function handleDelete() {
    if (!confirm("Delete this want?")) return;
    await supabase.from("wants").delete().eq("id", want!.id);
    router.push("/dashboard");
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-[#3D3D3D]">{want.name}</h1>
          <p className="text-xl text-[#7C9A82] mt-1">{formatCents(want.price_cents, want.currency)}</p>
        </div>
        <button onClick={handleDelete} className="text-[#B8C4B8] hover:text-red-400 transition-colors mt-1">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Status badge */}
      {isReady && !isDecided && (
        <div className="rounded-lg bg-[#C4956A]/10 border border-[#C4956A]/30 p-4">
          <p className="text-sm text-[#C4956A] font-medium">Your waiting period is complete.</p>
          <p className="text-xs text-[#C4956A]/80 mt-0.5">
            You&apos;ve saved {formatCents(want.total_saved_cents)}. Ready to decide?
          </p>
        </div>
      )}

      {/* Links */}
      {want.link_url && (
        <a
          href={want.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-[#7C9A82] hover:underline"
        >
          View product <ExternalLink size={14} />
        </a>
      )}

      {/* Reason */}
      {want.reason && (
        <div className="rounded-lg bg-[#FAF7F2] border border-[#B8C4B8]/30 p-4">
          <p className="text-xs text-[#B8C4B8] mb-1">Why you want it</p>
          <p className="text-sm text-[#3D3D3D]">{want.reason}</p>
        </div>
      )}

      {/* Progress */}
      <div className="rounded-lg bg-[#FAF7F2] border border-[#B8C4B8]/30 p-5 space-y-4">
        <ProgressBar
          value={timeProgress}
          label="Time"
          sublabel={
            isReady
              ? "Complete"
              : `${getDaysRemaining(want.ends_at)} days remaining`
          }
        />
        <ProgressBar
          value={savingsProgress}
          label="Savings"
          sublabel={`${formatCents(want.total_saved_cents)} / ${formatCents(want.price_cents)}`}
        />
        <p className="text-xs text-[#B8C4B8]">
          {formatCents(want.contribution_amount_cents)}{" "}
          {want.savings_frequency} · ends{" "}
          {format(new Date(want.ends_at), "MMM d, yyyy")}
        </p>
      </div>

      {/* Savings log */}
      {!isDecided && (
        <div className="rounded-lg bg-[#FAF7F2] border border-[#B8C4B8]/30 p-5">
          <SavingsLog
            wantId={want.id}
            entries={want.savings_entries}
            onLogged={refetch}
          />
        </div>
      )}

      {/* Reminder timeline */}
      {reminders.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-[#3D3D3D]">Timeline</h3>
          <div className="space-y-2">
            {reminders.map((r) => (
              <div
                key={r.id}
                className={`flex items-start gap-3 py-2 border-b border-[#B8C4B8]/20 last:border-0 ${
                  r.responded_at ? "opacity-60" : ""
                }`}
              >
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  r.type === "enthusiasm" ? "bg-[#C4956A]" : "bg-[#7C9A82]"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#B8C4B8]">
                    {format(new Date(r.scheduled_for), "MMM d, yyyy")} ·{" "}
                    {r.type === "enthusiasm" ? "Reflection" : "Savings"}
                  </p>
                  {r.responded_at && r.intensity && (
                    <p className="text-sm text-[#3D3D3D]">Intensity: {r.intensity}/10</p>
                  )}
                  {r.response && (
                    <p className="text-sm text-[#3D3D3D] mt-0.5 italic">&ldquo;{r.response}&rdquo;</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision CTA */}
      {isReady && !isDecided && (
        <Button
          size="lg"
          className="w-full"
          onClick={() => setDecisionOpen(true)}
        >
          Make your decision
        </Button>
      )}

      <DecisionModal
        want={want}
        open={decisionOpen}
        onOpenChange={setDecisionOpen}
        onDecided={() => {
          refetch();
          router.refresh();
        }}
      />
    </div>
  );
}
