"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { usePush } from "@/hooks/use-push";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SavingsFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();
  const { supported, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePush();

  type FormValues = {
    display_name: string;
    default_waiting_weeks: number;
    savings_frequency: SavingsFrequency;
    default_savings_reminder_freq: SavingsFrequency;
    default_enthusiasm_min_days: number;
    default_enthusiasm_max_days: number;
  };

  const { register, handleSubmit, reset } = useForm<FormValues>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
          if (data) reset({ ...data, display_name: data.display_name ?? undefined });
        });
    });
  }, [supabase, reset]);

  async function onSubmit(data: FormValues) {
    if (!profile) return;
    await supabase.from("profiles").update({
      display_name: data.display_name || null,
      default_waiting_weeks: data.default_waiting_weeks,
      savings_frequency: data.savings_frequency,
      default_savings_reminder_freq: data.default_savings_reminder_freq,
      default_enthusiasm_min_days: data.default_enthusiasm_min_days,
      default_enthusiasm_max_days: data.default_enthusiasm_max_days,
    }).eq("id", profile.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!profile) return <div className="p-6 animate-pulse"><div className="h-8 bg-[#FAF7F2] rounded w-48" /></div>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-light text-[#3D3D3D]">Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="display_name"
          label="Display name"
          placeholder="Your name"
          {...register("display_name")}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#3D3D3D]">Default waiting period (weeks)</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
            {...register("default_waiting_weeks", { valueAsNumber: true })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#3D3D3D]">Default savings frequency</label>
          <select
            className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
            {...register("savings_frequency")}
          >
            {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#3D3D3D]">Default savings reminder frequency</label>
          <select
            className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
            {...register("default_savings_reminder_freq")}
          >
            {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#3D3D3D]">Reflection reminder min (days)</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
              {...register("default_enthusiasm_min_days", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#3D3D3D]">Max (days)</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
              {...register("default_enthusiasm_max_days", { valueAsNumber: true })}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          {saved ? "Saved!" : "Save settings"}
        </Button>
      </form>

      {supported && (
        <div className="border-t border-[#B8C4B8]/30 pt-6 space-y-3">
          <div>
            <p className="text-sm font-medium text-[#3D3D3D]">Push notifications</p>
            <p className="text-xs text-[#B8C4B8] mt-0.5">
              Get notified when it&apos;s time to save or reflect on a want.
            </p>
          </div>
          {subscribed ? (
            <Button variant="secondary" size="sm" onClick={unsubscribe} disabled={pushLoading}>
              {pushLoading ? "..." : "Turn off notifications"}
            </Button>
          ) : (
            <Button size="sm" onClick={subscribe} disabled={pushLoading}>
              {pushLoading ? "..." : "Turn on notifications"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
