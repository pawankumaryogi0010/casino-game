-- =====================================================================
-- VEGA CASINO — FULL SCHEMA (v2)
-- Includes: profiles, transactions, game_sessions, bets, RPC functions
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone_number text unique,
  display_name text,
  balance numeric(14,2) not null default 1000.00, -- starter bonus
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update non-financial fields only (display_name).
-- Balance and role are locked — only RPC (security definer) or admins can change them.
create policy "profiles_update_own_restricted"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and balance = (select balance from public.profiles where id = auth.uid())
  );

create policy "profiles_admin_all"
  on public.profiles for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone_number)
  values (new.id, new.email, new.phone);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 2. TRANSACTIONS (deposits / withdrawals ledger)
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('deposit','withdrawal')),
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','success','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_id on public.transactions(user_id);
alter table public.transactions enable row level security;

create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id and status = 'pending');

create policy "transactions_admin_all"
  on public.transactions for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ---------------------------------------------------------------------
-- 3. GAME SESSIONS (shared realtime room state)
-- ---------------------------------------------------------------------
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_name text not null unique,        -- e.g. 'teen-patti-room-1'
  game_type text not null,               -- e.g. 'teen-patti'
  game_state jsonb not null default '{}'::jsonb,
  status text not null default 'waiting' check (status in ('waiting','betting','dealing','finished')),
  round_id uuid not null default gen_random_uuid(),
  round_ends_at timestamptz,
  rtp numeric(5,2) not null default 96.00, -- admin-controlled RTP %
  updated_at timestamptz not null default now()
);

create index if not exists idx_game_sessions_type on public.game_sessions(game_type);
alter table public.game_sessions enable row level security;

create policy "game_sessions_select_all"
  on public.game_sessions for select
  using (auth.role() = 'authenticated');

create policy "game_sessions_admin_write"
  on public.game_sessions for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_game_sessions_updated_at on public.game_sessions;
create trigger trg_game_sessions_updated_at
  before update on public.game_sessions
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------
-- 4. BETS (per-round wagers — drives payouts & admin analytics)
-- ---------------------------------------------------------------------
create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  round_id uuid not null,
  choice text not null,            -- e.g. 'andar', 'player', 'red', tile index, etc.
  amount numeric(14,2) not null check (amount > 0),
  payout numeric(14,2) default 0,
  status text not null default 'placed' check (status in ('placed','won','lost','refunded')),
  created_at timestamptz not null default now()
);

create index if not exists idx_bets_user_id on public.bets(user_id);
create index if not exists idx_bets_session_round on public.bets(session_id, round_id);

alter table public.bets enable row level security;

create policy "bets_select_own"
  on public.bets for select
  using (auth.uid() = user_id);

-- Inserts go through the place_bet() RPC only (security definer),
-- so no direct insert policy is granted to regular users.
create policy "bets_admin_all"
  on public.bets for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );


-- ---------------------------------------------------------------------
-- 5. RPC FUNCTIONS (security definer — bypass RLS safely with checks)
-- ---------------------------------------------------------------------

-- 5.1 Place a bet: atomically validates + deducts balance + records bet
create or replace function public.place_bet(
  p_session_id uuid,
  p_round_id uuid,
  p_choice text,
  p_amount numeric
)
returns public.bets
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_balance numeric;
  v_session_status text;
  v_new_bet public.bets;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount <= 0 then
    raise exception 'Invalid bet amount';
  end if;

  -- Lock the profile row to prevent race conditions on balance
  select balance into v_balance
  from public.profiles
  where id = v_uid
  for update;

  if v_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  -- Ensure the round is still accepting bets
  select status into v_session_status
  from public.game_sessions
  where id = p_session_id and round_id = p_round_id
  for update;

  if v_session_status is distinct from 'betting' then
    raise exception 'Betting window closed';
  end if;

  -- Deduct balance
  update public.profiles
  set balance = balance - p_amount
  where id = v_uid;

  -- Record bet
  insert into public.bets (user_id, session_id, round_id, choice, amount, status)
  values (v_uid, p_session_id, p_round_id, p_choice, p_amount, 'placed')
  returning * into v_new_bet;

  return v_new_bet;
end;
$$;

grant execute on function public.place_bet(uuid, uuid, text, numeric) to authenticated;


-- 5.2 Settle a round: pays out winning bets for a given session+round
-- Called by admin client or a scheduled job after the result is determined.
create or replace function public.settle_round(
  p_session_id uuid,
  p_round_id uuid,
  p_winning_choice text,
  p_multiplier numeric default 2.0
)
returns void
language plpgsql
security definer
as $$
declare
  v_caller_role text;
  v_bet record;
  v_payout numeric;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role is distinct from 'admin' then
    raise exception 'Only admins can settle rounds';
  end if;

  for v_bet in
    select * from public.bets
    where session_id = p_session_id and round_id = p_round_id and status = 'placed'
  loop
    if v_bet.choice = p_winning_choice then
      v_payout := v_bet.amount * p_multiplier;

      update public.profiles
      set balance = balance + v_payout
      where id = v_bet.user_id;

      update public.bets
      set status = 'won', payout = v_payout
      where id = v_bet.id;
    else
      update public.bets
      set status = 'lost', payout = 0
      where id = v_bet.id;
    end if;
  end loop;
end;
$$;

grant execute on function public.settle_round(uuid, uuid, text, numeric) to authenticated;


-- 5.3 Adjust balance: used by payment-gateway for deposits/withdrawals
create or replace function public.adjust_balance(
  p_user_id uuid,
  p_delta numeric,
  p_reason text default 'adjustment'
)
returns numeric
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_caller_role text;
  v_balance numeric;
begin
  select role into v_caller_role from public.profiles where id = v_uid;

  -- A user may only adjust their own balance for deposits (positive delta).
  -- Withdrawals (negative delta) also self-service but checked against balance.
  -- Admins may adjust any account.
  if v_uid is distinct from p_user_id and v_caller_role is distinct from 'admin' then
    raise exception 'Not authorized to adjust this balance';
  end if;

  select balance into v_balance from public.profiles where id = p_user_id for update;

  if v_balance + p_delta < 0 then
    raise exception 'Insufficient balance';
  end if;

  update public.profiles
  set balance = balance + p_delta
  where id = p_user_id;

  return v_balance + p_delta;
end;
$$;

grant execute on function public.adjust_balance(uuid, numeric, text) to authenticated;


-- ---------------------------------------------------------------------
-- 6. REALTIME PUBLICATION
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.profiles;


-- ---------------------------------------------------------------------
-- 7. SEED DATA — register the 20 games as game_sessions rows
-- ---------------------------------------------------------------------
insert into public.game_sessions (game_name, game_type, status, game_state, rtp)
values
  ('teen-patti-room-1',  'teen-patti',     'waiting', '{}', 96.00),
  ('andar-bahar-room-1', 'andar-bahar',    'waiting', '{}', 96.50),
  ('crash-room-1',       'crash',          'waiting', '{}', 97.00),
  ('roulette-room-1',    'roulette',       'waiting', '{}', 97.30),
  ('blackjack-room-1',   'blackjack',      'waiting', '{}', 98.00),
  ('baccarat-room-1',    'baccarat',       'waiting', '{}', 98.50),
  ('jhandi-munda-room-1','jhandi-munda',   'waiting', '{}', 95.00),
  ('dragon-tiger-room-1','dragon-tiger',   'waiting', '{}', 96.00),
  ('seven-up-down-room-1','seven-up-down', 'waiting', '{}', 94.50),
  ('car-roulette-room-1','car-roulette',   'waiting', '{}', 95.50),
  ('ludo-room-1',        'ludo',           'waiting', '{}', 94.00),
  ('plinko-room-1',      'plinko',         'waiting', '{}', 97.00),
  ('mines-room-1',       'mines',          'waiting', '{}', 97.50),
  ('wheel-fortune-room-1','wheel-fortune', 'waiting', '{}', 95.00),
  ('slots-3reel-room-1', 'slots-3reel',    'waiting', '{}', 96.00),
  ('video-poker-room-1', 'video-poker',    'waiting', '{}', 98.00),
  ('red-dog-room-1',     'red-dog',        'waiting', '{}', 95.50),
  ('sicbo-room-1',       'sicbo',          'waiting', '{}', 96.50),
  ('hilo-room-1',        'hilo',           'waiting', '{}', 96.00),
  ('keno-room-1',        'keno',           'waiting', '{}', 93.00)
on conflict (game_name) do nothing;
