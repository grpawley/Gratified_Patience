import { createClient } from "jsr:@supabase/supabase-js@2";

// Web Push implementation (no npm in Edge Functions — using manual signing)
async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url: string },
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  const webpush = await import("npm:web-push@3");
  webpush.default.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  await webpush.default.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload)
  );
}

Deno.serve(async (req) => {
  // Allow cron invocation or manual POST
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@gratifiedpatience.app";

  const now = new Date().toISOString();

  // Get all due, unresponded reminders with their want and user subscriptions
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select(`
      id, type, prompt, want_id, user_id,
      want:wants(name)
    `)
    .is("responded_at", null)
    .lte("scheduled_for", now)
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!reminders || reminders.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
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
    // Get this user's push subscriptions
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subs || subs.length === 0) continue;

    for (const reminder of userReminders) {
      const wantName = (reminder.want as { name: string } | null)?.name ?? "your want";

      const payload =
        reminder.type === "savings"
          ? {
              title: "Time to save",
              body: `Set aside some money for ${wantName}.`,
              url: `/wants/${reminder.want_id}`,
            }
          : {
              title: "A reflection",
              body: reminder.prompt ?? `How much do you still want ${wantName}?`,
              url: `/wants/${reminder.want_id}`,
            };

      for (const sub of subs) {
        try {
          await sendPushNotification(sub, payload, vapidPublicKey, vapidPrivateKey, vapidSubject);
          sent++;
        } catch (err) {
          console.error("Push failed:", err);
          // Remove expired/invalid subscriptions
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

  return new Response(JSON.stringify({ sent, failed }), { status: 200 });
});
