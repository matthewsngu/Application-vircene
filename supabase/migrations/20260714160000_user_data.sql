-- Vircène — données utilisateur (sync cloud)
-- Table : user_data — contient les données app de chaque utilisateur
-- À exécuter dans Supabase → SQL Editor (après la migration profiles)

create table if not exists public.user_data (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  products      jsonb,
  routine       jsonb,
  scan_analysis jsonb,
  face_scan_history jsonb,
  activity_log  jsonb,
  updated_at    timestamptz not null default now()
);

-- RLS : chaque utilisateur ne voit que sa propre ligne
alter table public.user_data enable row level security;

drop policy if exists "user_data_select_own" on public.user_data;
create policy "user_data_select_own"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "user_data_insert_own" on public.user_data;
create policy "user_data_insert_own"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_data_update_own" on public.user_data;
create policy "user_data_update_own"
  on public.user_data for update
  using (auth.uid() = user_id);

drop policy if exists "user_data_delete_own" on public.user_data;
create policy "user_data_delete_own"
  on public.user_data for delete
  using (auth.uid() = user_id);

-- Trigger updated_at
create or replace function public.set_user_data_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_data_set_updated_at on public.user_data;
create trigger user_data_set_updated_at
  before update on public.user_data
  for each row execute function public.set_user_data_updated_at();
