"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

export function usePendingReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchReminders = useCallback(async () => {
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .is("responded_at", null)
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true });

    setReminders(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { reminders, loading, refetch: fetchReminders };
}

export function useRemindersForWant(wantId: string) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchReminders = useCallback(async () => {
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .eq("want_id", wantId)
      .order("scheduled_for", { ascending: true });

    setReminders(data ?? []);
    setLoading(false);
  }, [supabase, wantId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  return { reminders, loading, refetch: fetchReminders };
}
