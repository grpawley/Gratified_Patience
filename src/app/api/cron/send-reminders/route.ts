import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel automatically sets Authorization: Bearer <CRON_SECRET> on cron requests
function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET) return true; // dev — skip check
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

async function sendPush(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: { title: string; body: string; url: string }
) {
  const webpush = await import("web-push");
  webpush.default.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  await webpush.default.sendNotification(
    { endpoint, keys: { p256dh, auth } },
    JSON.stringify(payload)
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id, type, prompt, want_id, user_id, want:wants(name)")
    .is("responded_at", null)
    .lte("scheduled_for", now)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by user
  const byUser: Record<string, typeof reminders> = {};
  for (const r of reminders) {
    if (!byUser[r.user_id]) byUser[r.user_id] = [];
    byUser[r.user_id].push(r);
  }

  let sent = 0;
  let failed = 0;

  for (const [userId, userReminders] of Object.entries(byUser)) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subs || subs.length === 0) continue;

    for (const reminder of userReminders) {
      const wantName = (reminder.want as { name: string } | null)?.name ?? "your want";
      const payload =
        reminder.type === "savings"
          ? { title: "Time to save", body: `Set aside some money for ${wantName}.`, url: `/wants/${reminder.want_id}` }
          : { title: "A reflection", body: reminder.prompt ?? `How much do you still want ${wantName}?`, url: `/wants/${reminder.want_id}` };

      for (const sub of subs) {
        try {
          await sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
          sent++;
        } catch (err: unknown) {
          // Remove expired subscriptions (410 Gone)
          if ((err as { statusCode?: number }).statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
          failed++;
        }
      }
    }
  }

  return NextResponse.json({ sent, failed });
}
