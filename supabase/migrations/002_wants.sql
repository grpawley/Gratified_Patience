create table if not exists public.wants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  price_cents int not null,
  currency text not null default 'USD',
  image_url text,
  link_url text,
  reason text,
  category text,
  waiting_period_days int not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  savings_frequency text not null default 'weekly' check (savings_frequency in ('daily','weekly','biweekly','monthly')),
  contribution_amount_cents int not null,
  status text not null default 'active' check (status in ('active','decided','expired')),
  savings_reminder_frequency text not null default 'weekly' check (savings_reminder_frequency in ('daily','weekly','biweekly','monthly')),
  enthusiasm_reminder_min_days int not null default 7,
  enthusiasm_reminder_max_days int not null default 21,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wants enable row level security;

create policy "Users can manage own wants"
  on public.wants for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
