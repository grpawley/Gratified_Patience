create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_waiting_weeks int not null default 26,
  savings_frequency text not null default 'weekly' check (savings_frequency in ('daily','weekly','biweekly','monthly')),
  default_savings_reminder_freq text not null default 'weekly' check (default_savings_reminder_freq in ('daily','weekly','biweekly','monthly')),
  default_enthusiasm_min_days int not null default 7,
  default_enthusiasm_max_days int not null default 21,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
