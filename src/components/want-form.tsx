"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { calculateContribution, formatCents, parseDollars } from "@/lib/savings";
import { generateAllReminders } from "@/lib/reminders";
import { computeEndsAt } from "@/lib/dates";
import {
  DEFAULT_WAITING_WEEKS,
  DEFAULT_SAVINGS_FREQUENCY,
  DEFAULT_SAVINGS_REMINDER_FREQ,
  DEFAULT_ENTHUSIASM_MIN_DAYS,
  DEFAULT_ENTHUSIASM_MAX_DAYS,
  FREQUENCY_LABELS,
} from "@/lib/constants";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type SavingsFrequency = "daily" | "weekly" | "biweekly" | "monthly";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  image_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  link_url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  reason: z.string().optional(),
  category: z.string().optional(),
  waiting_weeks: z.number().min(1).max(520),
  savings_frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  savings_reminder_frequency: z.enum(["daily", "weekly", "biweekly", "monthly"]),
  enthusiasm_reminder_min_days: z.number().min(1).max(365),
  enthusiasm_reminder_max_days: z.number().min(1).max(365),
});

type FormData = z.infer<typeof schema>;

interface WantFormProps {
  profile: Profile | null;
}

export function WantForm({ profile }: WantFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({ contribution: 0, frequency: "weekly" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      waiting_weeks: profile?.default_waiting_weeks ?? DEFAULT_WAITING_WEEKS,
      savings_frequency: (profile?.savings_frequency ?? DEFAULT_SAVINGS_FREQUENCY) as SavingsFrequency,
      savings_reminder_frequency: (profile?.default_savings_reminder_freq ?? DEFAULT_SAVINGS_REMINDER_FREQ) as SavingsFrequency,
      enthusiasm_reminder_min_days: profile?.default_enthusiasm_min_days ?? DEFAULT_ENTHUSIASM_MIN_DAYS,
      enthusiasm_reminder_max_days: profile?.default_enthusiasm_max_days ?? DEFAULT_ENTHUSIASM_MAX_DAYS,
    },
  });

  const price = watch("price");
  const waiting_weeks = watch("waiting_weeks");
  const savings_frequency = watch("savings_frequency");

  useEffect(() => {
    const priceCents = parseDollars(price || "0");
    const days = (waiting_weeks || DEFAULT_WAITING_WEEKS) * 7;
    const contribution = calculateContribution(priceCents, days, savings_frequency || "weekly");
    setPreview({ contribution, frequency: savings_frequency || "weekly" });
  }, [price, waiting_weeks, savings_frequency]);

  async function onSubmit(data: FormData) {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const priceCents = parseDollars(data.price);
    const waitingDays = data.waiting_weeks * 7;
    const startedAt = new Date().toISOString();
    const endsAt = computeEndsAt(startedAt, waitingDays).toISOString();
    const contribution = calculateContribution(priceCents, waitingDays, data.savings_frequency);

    const { data: want, error } = await supabase
      .from("wants")
      .insert({
        user_id: user.id,
        name: data.name,
        price_cents: priceCents,
        image_url: data.image_url || null,
        link_url: data.link_url || null,
        reason: data.reason || null,
        category: data.category || null,
        waiting_period_days: waitingDays,
        started_at: startedAt,
        ends_at: endsAt,
        savings_frequency: data.savings_frequency,
        contribution_amount_cents: contribution,
        savings_reminder_frequency: data.savings_reminder_frequency,
        enthusiasm_reminder_min_days: data.enthusiasm_reminder_min_days,
        enthusiasm_reminder_max_days: data.enthusiasm_reminder_max_days,
      })
      .select()
      .single();

    if (error || !want) {
      setLoading(false);
      return;
    }

    // Generate reminders
    const reminders = generateAllReminders({
      id: want.id,
      user_id: user.id,
      started_at: startedAt,
      ends_at: endsAt,
      savings_frequency: data.savings_frequency,
      savings_reminder_frequency: data.savings_reminder_frequency,
      contribution_amount_cents: contribution,
      enthusiasm_reminder_min_days: data.enthusiasm_reminder_min_days,
      enthusiasm_reminder_max_days: data.enthusiasm_reminder_max_days,
    });

    if (reminders.length > 0) {
      await supabase.from("reminders").insert(reminders);
    }

    router.push(`/wants/${want.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <Input
        id="name"
        label="What caught your eye?"
        placeholder="e.g. Mechanical keyboard"
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        id="price"
        label="How much does it cost?"
        placeholder="350.00"
        type="number"
        step="0.01"
        min="0"
        error={errors.price?.message}
        {...register("price")}
      />

      <Input
        id="link_url"
        label="Link (optional)"
        placeholder="https://..."
        error={errors.link_url?.message}
        {...register("link_url")}
      />

      <Input
        id="image_url"
        label="Image URL (optional)"
        placeholder="https://..."
        error={errors.image_url?.message}
        {...register("image_url")}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="reason" className="text-sm font-medium text-[#3D3D3D]">
          Why do you want it? (optional)
        </label>
        <textarea
          id="reason"
          rows={3}
          className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] placeholder:text-[#B8C4B8] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
          placeholder="I type all day and want a better experience..."
          {...register("reason")}
        />
      </div>

      <Input
        id="category"
        label="Category (optional)"
        placeholder="e.g. Tech, Clothing, Experience"
        {...register("category")}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="waiting_weeks" className="text-sm font-medium text-[#3D3D3D]">
          Waiting period (weeks)
        </label>
        <input
          id="waiting_weeks"
          type="number"
          min={1}
          max={520}
          className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
          {...register("waiting_weeks", { valueAsNumber: true })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="savings_frequency" className="text-sm font-medium text-[#3D3D3D]">
          Savings frequency
        </label>
        <select
          id="savings_frequency"
          className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
          {...register("savings_frequency")}
        >
          {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {preview.contribution > 0 && (
        <div className="rounded-lg bg-[#7C9A82]/10 border border-[#7C9A82]/30 p-4">
          <p className="text-sm text-[#3D3D3D]">
            Set aside{" "}
            <span className="font-semibold text-[#7C9A82]">
              {formatCents(preview.contribution)}
            </span>{" "}
            {FREQUENCY_LABELS[preview.frequency]?.toLowerCase()} for{" "}
            {watch("waiting_weeks")} weeks.
          </p>
        </div>
      )}

      <div className="border-t border-[#B8C4B8]/30 pt-6 space-y-4">
        <p className="text-sm font-medium text-[#3D3D3D]">Reminder settings</p>

        <div className="flex flex-col gap-1">
          <label htmlFor="savings_reminder_frequency" className="text-sm text-[#3D3D3D]">
            Savings reminders
          </label>
          <select
            id="savings_reminder_frequency"
            className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
            {...register("savings_reminder_frequency")}
          >
            {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="enthusiasm_reminder_min_days" className="text-sm text-[#3D3D3D]">
              Reflection reminders (min days)
            </label>
            <input
              id="enthusiasm_reminder_min_days"
              type="number"
              min={1}
              className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
              {...register("enthusiasm_reminder_min_days", { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="enthusiasm_reminder_max_days" className="text-sm text-[#3D3D3D]">
              Max days
            </label>
            <input
              id="enthusiasm_reminder_max_days"
              type="number"
              min={1}
              className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-[#3D3D3D] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
              {...register("enthusiasm_reminder_max_days", { valueAsNumber: true })}
            />
          </div>
        </div>
        <p className="text-xs text-[#B8C4B8]">
          Reflection reminders arrive at random intervals in this range — catching your genuine reaction.
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Saving..." : "Log this want"}
      </Button>
    </form>
  );
}
