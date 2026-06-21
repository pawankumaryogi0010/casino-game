-- ============================================
-- ELITE TACTICAL STRATEGY & YIELD PLATFORM
-- Supabase PostgreSQL Schema v1.0.0
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL DEFAULT 'Strategist',
    balance DECIMAL(16, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    vip_level INTEGER NOT NULL DEFAULT 0 CHECK (vip_level >= 0 AND vip_level <= 5),
    referral_code TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    commission_earned DECIMAL(16, 2) NOT NULL DEFAULT 0.00,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_referral ON public.profiles(referral_code);
CREATE INDEX idx_profiles_invited_by ON public.profiles(invited_by);
CREATE INDEX idx_profiles_vip ON public.profiles(vip_level);

-- ============================================
-- TABLE: game_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL,
    stake DECIMAL(16, 2) NOT NULL CHECK (stake >= 0),
    win_amount DECIMAL(16, 2) NOT NULL DEFAULT 0.00 CHECK (win_amount >= 0),
    multiplier DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    hash_seed TEXT NOT NULL,
    settlement TEXT NOT NULL DEFAULT 'PENDING' CHECK (settlement IN ('WON', 'LOST', 'PENDING')),
    game_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX idx_sessions_user ON public.game_sessions(user_id);
CREATE INDEX idx_sessions_user_date ON public.game_sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_game_type ON public.game_sessions(game_type);
CREATE INDEX idx_sessions_settlement ON public.game_sessions(settlement);

-- ============================================
-- TABLE: transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(16, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    method TEXT NOT NULL CHECK (method IN ('manual', 'nagad', 'bkash', 'usdt', 'upi')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    tx_id TEXT,
    screenshot_url TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- ============================================
-- TABLE: agent_commissions
-- ============================================
CREATE TABLE IF NOT EXISTS public.agent_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sub_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(16, 2) NOT NULL CHECK (amount >= 0),
    source_session_id UUID REFERENCES public.game_sessions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'cancelled')),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_commissions_agent ON public.agent_commissions(agent_id);
CREATE INDEX idx_commissions_agent_date ON public.agent_commissions(agent_id, date DESC);
CREATE INDEX idx_commissions_sub ON public.agent_commissions(sub_id);

-- ============================================
-- ATOMIC FUNCTION: handle_game_result
-- Prevents race-condition exploits
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_game_result(
    p_user_id UUID,
    p_session_id UUID,
    p_win_amount DECIMAL,
    p_settlement TEXT
)
RETURNS DECIMAL
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_balance DECIMAL;
    v_new_balance DECIMAL;
BEGIN
    -- Lock the profile row to prevent race conditions
    SELECT balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;

    -- Update the session settlement
    UPDATE public.game_sessions
    SET settlement = p_settlement,
        win_amount = p_win_amount,
        settled_at = NOW()
    WHERE id = p_session_id AND user_id = p_user_id AND settlement = 'PENDING';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session not found or already settled';
    END IF;

    -- Calculate new balance atomically
    IF p_settlement = 'WON' THEN
        v_new_balance := v_current_balance + p_win_amount;
    ELSE
        v_new_balance := v_current_balance;
    END IF;

    -- Update balance
    UPDATE public.profiles
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_game_result TO authenticated;

-- ============================================
-- FUNCTION: generate_provably_fair_seed
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_provably_fair_seed(
    p_user_id UUID,
    p_game_type TEXT
)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_server_seed TEXT;
    v_client_seed TEXT;
    v_nonce INTEGER;
    v_combined_hash TEXT;
BEGIN
    v_server_seed := encode(gen_random_bytes(32), 'hex');
    
    SELECT COUNT(*) + 1 INTO v_nonce
    FROM public.game_sessions
    WHERE user_id = p_user_id AND game_type = p_game_type;

    v_client_seed := p_user_id::TEXT || '-' || p_game_type || '-' || v_nonce::TEXT;
    v_combined_hash := encode(
        digest(v_server_seed || ':' || v_client_seed, 'sha256'),
        'hex'
    );

    RETURN v_combined_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_provably_fair_seed TO authenticated;

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_referral TEXT;
BEGIN
    LOOP
        v_referral := 'TAC' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = v_referral);
    END LOOP;

    INSERT INTO public.profiles (id, username, referral_code)
    VALUES (NEW.id, 'Tactician_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6), v_referral);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_timestamp ON public.profiles;
CREATE TRIGGER trg_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS trg_transactions_timestamp ON public.transactions;
CREATE TRIGGER trg_transactions_timestamp BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_commissions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "System insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Prevent profile delete" ON public.profiles FOR DELETE TO authenticated USING (false);

-- Game Sessions
CREATE POLICY "Users read own sessions" ON public.game_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update pending sessions" ON public.game_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id AND settlement = 'PENDING');
CREATE POLICY "Prevent session delete" ON public.game_sessions FOR DELETE TO authenticated USING (false);

-- Transactions
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create deposits" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND type = 'deposit');
CREATE POLICY "Prevent transaction modify" ON public.transactions FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Prevent transaction delete" ON public.transactions FOR DELETE TO authenticated USING (false);

-- Agent Commissions
CREATE POLICY "Agents read own commissions" ON public.agent_commissions FOR SELECT TO authenticated USING (auth.uid() = agent_id);
CREATE POLICY "System insert commissions" ON public.agent_commissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Prevent commission modify" ON public.agent_commissions FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Prevent commission delete" ON public.agent_commissions FOR DELETE TO authenticated USING (false);

-- ============================================
-- PERFORMANCE
-- ============================================
ALTER TABLE public.profiles SET (autovacuum_enabled = true, fillfactor = 90);
ALTER TABLE public.game_sessions SET (autovacuum_enabled = true, fillfactor = 85);
ALTER TABLE public.transactions SET (autovacuum_enabled = true, fillfactor = 90);
ALTER TABLE public.agent_commissions SET (autovacuum_enabled = true, fillfactor = 85);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.game_sessions TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT SELECT ON public.agent_commissions TO authenticated;
