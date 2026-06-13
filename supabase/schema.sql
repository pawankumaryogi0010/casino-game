-- Profiles + wallet (balance is NEVER client-writable)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  is_admin boolean not null default false,
  created_at timestamptz default now()
);
alter table profiles enable row level security;

create policy "read own profile" on profiles
  for select using (auth.uid() = id);
-- NOTE: no INSERT/UPDATE policy -> clients can't mutate balance directly.

-- Immutable ledger (append-only)
create table ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id),
  delta numeric(14,2) not null,
  reason text not null,            -- 'deposit','withdraw','bet','payout'
  ref uuid,                        -- game round id
  created_at timestamptz default now()
);
alter table ledger enable row level security;
create policy "read own ledger" on ledger for select using (auth.uid() = user_id);

-- Game rounds (clients read; only RPC writes outcomes)
create table game_sessions (
  id uuid primary key default gen_random_uuid(),
  game text not null,
  state text not null default 'betting',  -- betting|locked|resolved
  result jsonb,
  closes_at timestamptz,
  created_at timestamptz default now()
);
alter table game_sessions enable row level security;
create policy "read sessions" on game_sessions for select using (true);

-- Bets
create table bets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references game_sessions(id),
  user_id uuid not null references profiles(id),
  amount numeric(14,2) not null check (amount > 0),
  selection jsonb not null,
  payout numeric(14,2) default 0,
  created_at timestamptz default now()
);
alter table bets enable row level security;
create policy "read own bets" on bets for select using (auth.uid() = user_id);

-- TRUSTED: place a bet atomically (debits wallet, writes ledger)
create or replace function place_bet(p_round uuid, p_amount numeric, p_selection jsonb)
returns bets language plpgsql security definer set search_path = public as $$
declare v_bal numeric; v_bet bets; v_state text;
begin
  select state into v_state from game_sessions where id = p_round for update;
  if v_state <> 'betting' then raise exception 'betting closed'; end if;

  select balance into v_bal from profiles where id = auth.uid() for update;
  if v_bal < p_amount then raise exception 'insufficient funds'; end if;

  update profiles set balance = balance - p_amount where id = auth.uid();
  insert into ledger(user_id, delta, reason, ref) values (auth.uid(), -p_amount, 'bet', p_round);
  insert into bets(round_id, user_id, amount, selection)
    values (p_round, auth.uid(), p_amount, p_selection) returning * into v_bet;
  return v_bet;
end $$;

-- TRUSTED: mock deposit (replace with real PSP webhook in production)
create or replace function mock_deposit(p_amount numeric)
returns numeric language plpgsql security definer set search_path = public as $$
begin
  if p_amount <= 0 or p_amount > 100000 then raise exception 'bad amount'; end if;
  update profiles set balance = balance + p_amount where id = auth.uid();
  insert into ledger(user_id, delta, reason) values (auth.uid(), p_amount, 'deposit');
  return (select balance from profiles where id = auth.uid());
end $$;
