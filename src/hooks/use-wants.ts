"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import { getTotalSaved } from "@/lib/savings";

type Want = Database["public"]["Tables"]["wants"]["Row"];
type SavingsEntry = Database["public"]["Tables"]["savings_entries"]["Row"];

export interface WantWithSavings extends Want {
  savings_entries: SavingsEntry[];
  total_saved_cents: number;
}

export function useWants() {
  const [wants, setWants] = useState<WantWithSavings[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWants = useCallback(async () => {
    const { data } = await supabase
      .from("wants")
      .select("*, savings_entries(*)")
      .order("created_at", { ascending: false });

    if (data) {
      setWants(
        data.map((w) => ({
          ...w,
          total_saved_cents: getTotalSaved(w.savings_entries ?? []),
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchWants();
  }, [fetchWants]);

  return { wants, loading, refetch: fetchWants };
}

export function useWant(id: string) {
  const [want, setWant] = useState<WantWithSavings | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWant = useCallback(async () => {
    const { data } = await supabase
      .from("wants")
      .select("*, savings_entries(*)")
      .eq("id", id)
      .single();

    if (data) {
      setWant({
        ...data,
        total_saved_cents: getTotalSaved(data.savings_entries ?? []),
      });
    }
    setLoading(false);
  }, [supabase, id]);

  useEffect(() => {
    fetchWant();
  }, [fetchWant]);

  return { want, loading, refetch: fetchWant };
}
