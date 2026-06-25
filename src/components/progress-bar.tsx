"use client";

import * as Progress from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  sublabel?: string;
  className?: string;
  color?: "sage" | "amber";
}

export function ProgressBar({ value, label, sublabel, className, color = "sage" }: ProgressBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {(label || sublabel) && (
        <div className="flex justify-between text-xs text-[#B8C4B8]">
          <span>{label}</span>
          <span>{sublabel}</span>
        </div>
      )}
      <Progress.Root
        className="relative overflow-hidden bg-[#B8C4B8]/30 rounded-full h-2"
        value={value}
      >
        <Progress.Indicator
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color === "sage" ? "bg-[#7C9A82]" : "bg-[#C4956A]"
          )}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </Progress.Root>
    </div>
  );
}
