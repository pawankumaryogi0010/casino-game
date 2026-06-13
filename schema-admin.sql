-- =============================================================
-- schema-admin.sql  -  run AFTER schema.sql and schema-payments.sql
-- Admin config, audit log, and admin-gated server RPCs.
--
-- RTP NOTE: game_settings stores a REQUESTED target RTP that the
-- SERVER maps to published payout multipliers within a legal range.
-- It is NOT a client win-probability knob. Outcome RNG stays in
-- play_round (server). Every privileged action is written to
-- admin_audit so changes are traceable.
-- =============================================================

-- per-game settings
create table if not exists public.game_settings (
  game_key    text primary key,
  display_name text not null,
  target_rtp  numeric(5,2) not null default 96.00 check (target_rtp between 80 and 99),
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now()
);

-- ban flag on profiles
alter table public.profiles add column if not exists banned boolean not null default false;

-- audit log of privileged actions
create table if not exists public.admin_audit (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public.profiles (id),
  action     text not null,
  target     text,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.game_settings enable row level security;
alter table public.admin_audit   enable row level security;

-- everyone authenticated can READ settings (games read target only via server);
-- only admins can write.
drop policy if exists "gset_read" on public.game_settings;
create policy "gset_read" on public.game_settings for select using (auth.role() = 'authenticated');
drop policy if exists "gset_admin_write" on public.game_settings;
create policy "gset_admin_write" on public.game_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "audit_admin_read" on public.admin_audit;
create policy "audit_admin_read" on public.admin_audit for select using (public.is_admin());

-- ---- admin RPCs (all verify is_admin, all audited) ----

-- Approve a pending deposit: credit balance + log, atomically.
create or replace function public.admin_approve_deposit(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin uuid := auth.uid(); v_uid uuid; v_amt numeric;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_kind = 'crypto' then
    update public.crypto_deposits set status='approved', reviewed_at=now()
      where id=p_id and status='pending' returning user_id, amount into v_uid, v_amt;
  else raise exception 'unknown deposit kind'; end if;
  if v_uid is null then raise exception 'deposit not found or not pending'; end if;
  if v_amt is null or v_amt <= 0 then raise exception 'deposit amount must be verified > 0 before approval'; end if;
  update public.profiles set balance = balance + v_amt where id = v_uid;
  insert into public.transactions (user_id, type, amount, status) values (v_uid, 'deposit', v_amt, 'success');
  insert into public.admin_audit (admin_id, action, target, detail)
    values (v_admin, 'approve_deposit', p_id::text, jsonb_build_object('kind',p_kind,'user',v_uid,'amount',v_amt));
end; $$;

create or replace function public.admin_reject_deposit(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_kind = 'crypto' then
    update public.crypto_deposits set status='rejected', reviewed_at=now() where id=p_id and status='pending';
  else raise exception 'unknown deposit kind'; end if;
  insert into public.admin_audit (admin_id, action, target, detail)
    values (v_admin, 'reject_deposit', p_id::text, jsonb_build_object('kind',p_kind));
end; $$;

-- Set a game's requested target RTP (mapped to payouts server-side).
create or replace function public.admin_set_game_rtp(p_game_key text, p_display text, p_rtp numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_rtp < 80 or p_rtp > 99 then raise exception 'RTP must be within the legal 80-99%% range'; end if;
  insert into public.game_settings (game_key, display_name, target_rtp)
    values (p_game_key, p_display, p_rtp)
    on conflict (game_key) do update set target_rtp = excluded.target_rtp, updated_at = now();
  insert into public.admin_audit (admin_id, action, target, detail)
    values (v_admin, 'set_rtp', p_game_key, jsonb_build_object('rtp',p_rtp));
end; $$;

-- Ban / unban a user.
create or replace function public.admin_set_ban(p_user uuid, p_banned boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_admin uuid := auth.uid();
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  update public.profiles set banned = p_banned where id = p_user;
  insert into public.admin_audit (admin_id, action, target, detail)
    values (v_admin, 'set_ban', p_user::text, jsonb_build_object('banned',p_banned));
end; $$;

-- Manual balance adjustment (audited; reason required).
create or replace function public.admin_adjust_balance(p_user uuid, p_delta numeric, p_reason text)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_admin uuid := auth.uid(); v_bal numeric;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'reason required for manual adjustment'; end if;
  update public.profiles set balance = balance + p_delta where id = p_user returning balance into v_bal;
  if v_bal < 0 then raise exception 'adjustment would make balance negative'; end if;
  insert into public.transactions (user_id, type, amount, status)
    values (p_user, case when p_delta >= 0 then 'deposit' else 'withdrawal' end, abs(p_delta), 'success');
  insert into public.admin_audit (admin_id, action, target, detail)
    values (v_admin, 'adjust_balance', p_user::text, jsonb_build_object('delta',p_delta,'reason',p_reason));
  return v_bal;
end; $$;
