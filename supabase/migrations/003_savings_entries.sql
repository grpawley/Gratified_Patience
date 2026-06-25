create table if not exists public.savings_entries (
  id uuid primary key default gen_random_uuid(),
  want_id uuid not null references public.wants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount_cents int not null,
  note text,
  logged_at timestamptz not null default now()
);

alter table public.savings_entries enable row level security;

create policy "Users can manage own savings entries"
  on public.savings_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
