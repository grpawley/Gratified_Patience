"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];

interface EnthusiasmPromptProps {
  reminder: Reminder;
  wantName: string;
  onResponded: () => void;
}

export function EnthusiasmPrompt({ reminder, wantName, onResponded }: EnthusiasmPromptProps) {
  const [intensity, setIntensity] = useState([5]);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit() {
    setLoading(true);
    await supabase
      .from("reminders")
      .update({
        intensity: intensity[0],
        response: response || null,
        responded_at: new Date().toISOString(),
      })
      .eq("id", reminder.id);

    setLoading(false);
    onResponded();
  }

  return (
    <div className="rounded-xl bg-[#FAF7F2] border border-[#B8C4B8]/30 p-6 space-y-5">
      <div>
        <p className="text-xs text-[#B8C4B8] uppercase tracking-wide mb-1">Reflection</p>
        <p className="text-sm text-[#B8C4B8]">{wantName}</p>
        <p className="text-base text-[#3D3D3D] mt-2 font-medium">
          {reminder.prompt}
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs text-[#B8C4B8]">
          <span>Not really</span>
          <span className="text-[#7C9A82] font-semibold text-sm">{intensity[0]} / 10</span>
          <span>Definitely</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={intensity}
          onValueChange={setIntensity}
          min={1}
          max={10}
          step={1}
        >
          <Slider.Track className="bg-[#B8C4B8]/30 relative grow rounded-full h-2">
            <Slider.Range className="absolute bg-[#7C9A82] rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-white border-2 border-[#7C9A82] rounded-full shadow focus:outline-none focus:ring-2 focus:ring-[#7C9A82]"
            aria-label="Intensity"
          />
        </Slider.Root>
      </div>

      <textarea
        rows={2}
        className="w-full rounded-lg border border-[#B8C4B8] bg-white px-3 py-2 text-sm text-[#3D3D3D] placeholder:text-[#B8C4B8] focus:border-[#7C9A82] focus:outline-none focus:ring-1 focus:ring-[#7C9A82]"
        placeholder="Anything on your mind? (optional)"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />

      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? "Saving..." : "Record reflection"}
      </Button>
    </div>
  );
}
