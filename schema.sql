-- =============================================================
-- Lux Royale Casino - PostgreSQL / Supabase schema
-- =============================================================
-- Run in the Supabase SQL editor. Order matters (extensions ->
-- tables -> RLS -> policies -> realtime).
-- =============================================================

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 1. profiles
--    One row per authenticated user. id matches auth.users.id
--    so RLS can compare against auth.uid().
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  phone_number text unique,
  balance      numeric(14,2) not null default 0.00 check (balance >= 0),
  role         text not null default 'user' check (role in ('user','admin')),
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 2. transactions
-- -------------------------------------------------------------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null check (type in ('deposit','withdrawal')),
  amount     numeric(14,2) not null check (amount > 0),
  status     text not null default 'pending' check (status in ('pending','success','failed')),
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_id_idx on public.transactions (user_id);

-- -------------------------------------------------------------
-- 3. game_sessions
--    Shared game state broadcast to all players via Realtime.
-- -------------------------------------------------------------
create table if not exists public.game_sessions (
  id         uuid primary key default gen_random_uuid(),
  game_name  text not null,
  game_state jsonb not null default '{}'::jsonb,
  status     text not null default 'waiting' check (status in ('waiting','betting','active','closed')),
  updated_at timestamptz not null default now()
);
create index if not exists game_sessions_status_idx on public.game_sessions (status);

-- Keep updated_at fresh on every change.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_game_sessions_touch on public.game_sessions;
create trigger trg_game_sessions_touch
  before update on public.game_sessions
  for each row execute function public.touch_updated_at();

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone_number)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles      enable row level security;
alter table public.transactions  enable row level security;
alter table public.game_sessions enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------- profiles policies ----------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- Users may update their own row BUT NOT balance or role.
-- Balance must only change via the secure server-side RPC below.
drop policy if exists "profiles_update_own_safe" on public.profiles;
create policy "profiles_update_own_safe" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and balance = (select balance from public.profiles where id = auth.uid())
  );

-- ---------------- transactions policies ----------------
drop policy if exists "tx_select_own" on public.transactions;
create policy "tx_select_own" on public.transactions
  for select using (auth.uid() = user_id or public.is_admin());

-- Users can request a (pending) transaction for themselves only.
drop policy if exists "tx_insert_own_pending" on public.transactions;
create policy "tx_insert_own_pending" on public.transactions
  for insert with check (auth.uid() = user_id and status = 'pending');

-- ---------------- game_sessions policies ----------------
-- Everyone authenticated can READ shared game state.
drop policy if exists "gs_select_all" on public.game_sessions;
create policy "gs_select_all" on public.game_sessions
  for select using (auth.role() = 'authenticated');

-- Only admins (the house) may create/modify game state.
drop policy if exists "gs_admin_write" on public.game_sessions;
create policy "gs_admin_write" on public.game_sessions
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================
-- SECURE BALANCE MUTATION (server-side, runs as definer)
-- Client NEVER writes balance directly. It calls this RPC,
-- which validates funds and records the transaction atomically.
-- =============================================================
create or replace function public.process_transaction(p_type text, p_amount numeric)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if p_type not in ('deposit','withdrawal') then raise exception 'invalid type'; end if;

  select * into v_profile from public.profiles where id = v_uid for update;

  if p_type = 'withdrawal' and v_profile.balance < p_amount then
    raise exception 'insufficient funds';
  end if;

  update public.profiles
     set balance = balance + (case when p_type = 'deposit' then p_amount else -p_amount end)
   where id = v_uid
   returning * into v_profile;

  insert into public.transactions (user_id, type, amount, status)
  values (v_uid, p_type, p_amount, 'success');

  return v_profile;
end;
$$;

-- =============================================================
-- REALTIME: broadcast game_sessions changes to all clients
-- =============================================================
alter publication supabase_realtime add table public.game_sessions;
