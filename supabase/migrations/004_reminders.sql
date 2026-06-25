create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  want_id uuid not null references public.wants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('savings','enthusiasm')),
  prompt text,
  response text,
  intensity int check (intensity >= 1 and intensity <= 10),
  scheduled_for timestamptz not null,
  responded_at timestamptz
);

alter table public.reminders enable row level security;

create policy "Users can manage own reminders"
  on public.reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
