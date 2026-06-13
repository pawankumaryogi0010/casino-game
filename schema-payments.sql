-- =============================================================
-- schema-payments.sql  -  run AFTER schema.sql
-- crypto deposits + withdrawal requests. Clients may only INSERT
-- a PENDING row for themselves; they can never set approved/success
-- or write balance. Crediting happens via admin-gated server RPCs.
-- =============================================================

create table if not exists public.crypto_deposits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  network     text not null default 'TRC20',
  amount      numeric(14,2),
  tx_id       text not null,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (network, tx_id)
);
create index if not exists crypto_deposits_user_idx on public.crypto_deposits (user_id);
create index if not exists crypto_deposits_status_idx on public.crypto_deposits (status);

create table if not exists public.withdrawals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  method      text not null check (method in ('upi','usdt_trc20')),
  amount      numeric(14,2) not null check (amount > 0),
  destination text not null,
  status      text not null default 'pending_withdrawal' check (status in ('pending_withdrawal','processing','paid','rejected')),
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists withdrawals_user_idx on public.withdrawals (user_id);
create index if not exists withdrawals_status_idx on public.withdrawals (status);

alter table public.crypto_deposits enable row level security;
alter table public.withdrawals     enable row level security;

drop policy if exists "cd_select_own" on public.crypto_deposits;
create policy "cd_select_own" on public.crypto_deposits
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "cd_insert_own_pending" on public.crypto_deposits;
create policy "cd_insert_own_pending" on public.crypto_deposits
  for insert with check (auth.uid() = user_id and status = 'pending');
drop policy if exists "cd_admin_update" on public.crypto_deposits;
create policy "cd_admin_update" on public.crypto_deposits
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "wd_select_own" on public.withdrawals;
create policy "wd_select_own" on public.withdrawals
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "wd_insert_own_pending" on public.withdrawals;
create policy "wd_insert_own_pending" on public.withdrawals
  for insert with check (auth.uid() = user_id and status = 'pending_withdrawal');
drop policy if exists "wd_admin_update" on public.withdrawals;
create policy "wd_admin_update" on public.withdrawals
  for update using (public.is_admin()) with check (public.is_admin());

-- Withdrawal request: validates + holds funds atomically server-side.
create or replace function public.request_withdrawal(p_method text, p_amount numeric, p_destination text)
returns public.withdrawals language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_bal numeric; v_row public.withdrawals;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  if p_method not in ('upi','usdt_trc20') then raise exception 'invalid method'; end if;
  select balance into v_bal from public.profiles where id = v_uid for update;
  if v_bal < p_amount then raise exception 'insufficient funds'; end if;
  update public.profiles set balance = balance - p_amount where id = v_uid;
  insert into public.transactions (user_id, type, amount, status) values (v_uid, 'withdrawal', p_amount, 'pending');
  insert into public.withdrawals (user_id, method, amount, destination, status)
  values (v_uid, p_method, p_amount, p_destination, 'pending_withdrawal') returning * into v_row;
  return v_row;
end; $$;
