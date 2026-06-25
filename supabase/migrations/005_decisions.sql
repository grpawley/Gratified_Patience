create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  want_id uuid unique not null references public.wants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  outcome text not null check (outcome in ('bought','extended','walked_away')),
  reflection text,
  decided_at timestamptz not null default now(),
  extended_until timestamptz
);

alter table public.decisions enable row level security;

create policy "Users can manage own decisions"
  on public.decisions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
