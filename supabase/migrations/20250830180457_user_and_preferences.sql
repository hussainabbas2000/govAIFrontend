-- USERS table (linked to auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  created_at timestamptz default now()
);

-- PREFERENCES table with defaults
create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  opportunity_type text not null default 'none',
  location text not null default 'none',
  interested_departments text not null default 'none',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- updated_at trigger
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_preferences_touch
before update on public.preferences
for each row execute procedure touch_updated_at();

-- auto-create user profile on auth signup
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_auth_user();

-- auto-create preferences when user is created
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql;

create trigger on_user_created
after insert on public.users
for each row execute procedure handle_new_user();

-- RLS
alter table public.users enable row level security;
alter table public.preferences enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

create policy "prefs_all_own" on public.preferences
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
