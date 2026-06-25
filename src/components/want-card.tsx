"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/progress-bar";
import { formatCents, getSavingsProgress } from "@/lib/savings";
import { getTimeProgress, getDaysRemaining, isWaitingPeriodComplete } from "@/lib/dates";
import type { WantWithSavings } from "@/hooks/use-wants";
import { cn } from "@/lib/utils";

interface WantCardProps {
  want: WantWithSavings;
}

export function WantCard({ want }: WantCardProps) {
  const timeProgress = getTimeProgress(want.started_at, want.ends_at);
  const savingsProgress = getSavingsProgress(want.total_saved_cents, want.price_cents);
  const daysRemaining = getDaysRemaining(want.ends_at);
  const isReady = isWaitingPeriodComplete(want.ends_at);

  const savingsStatus =
    savingsProgress >= timeProgress + 5
      ? "ahead"
      : savingsProgress < timeProgress - 10
      ? "behind"
      : "on-track";

  return (
    <Link href={`/wants/${want.id}`}>
      <Card className={cn("cursor-pointer", isReady && "ring-2 ring-[#C4956A]/50")}>
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-medium text-[#3D3D3D] line-clamp-1">{want.name}</h3>
              <p className="text-sm text-[#B8C4B8] mt-0.5">
                {formatCents(want.price_cents, want.currency)}
              </p>
            </div>
            {isReady ? (
              <span className="text-xs bg-[#C4956A]/20 text-[#C4956A] px-2 py-0.5 rounded-full whitespace-nowrap">
                Ready to decide
              </span>
            ) : (
              <span className="text-xs text-[#B8C4B8] whitespace-nowrap">
                {daysRemaining}d left
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ProgressBar
              value={timeProgress}
              label="Time"
              sublabel={
                isReady
                  ? "Complete"
                  : `${daysRemaining} days left`
              }
            />
            <ProgressBar
              value={savingsProgress}
              label="Saved"
              sublabel={`${formatCents(want.total_saved_cents)} / ${formatCents(want.price_cents)}`}
              color={savingsStatus === "behind" ? "amber" : "sage"}
            />
          </div>
          {savingsStatus === "behind" && (
            <p className="text-xs text-[#C4956A] mt-2">A little behind on savings</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
