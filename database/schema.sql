-- ============================================
-- EMERALD KING - SKILL-BASED GAMING PLATFORM
-- Complete Database Schema
-- Supabase PostgreSQL (Free Tier Compatible)
-- Version: 3.0.0 Production
-- ============================================

-- ============================================
-- EXTENSION SETUP
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: PROFILES
-- Core user profiles linked to Supabase Auth
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL DEFAULT 'Player',
    casino_id TEXT UNIQUE NOT NULL,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    vip_level INTEGER NOT NULL DEFAULT 0 CHECK (vip_level >= 0 AND vip_level <= 5),
    referral_code TEXT UNIQUE NOT NULL,
    total_referrals INTEGER NOT NULL DEFAULT 0 CHECK (total_referrals >= 0),
    commission_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (commission_earned >= 0),
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_casino_id ON public.profiles(casino_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_vip_level ON public.profiles(vip_level);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);

-- ============================================
-- TABLE 2: GAME SESSIONS
-- Tracks every skill-based gameplay session
-- ============================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_identifier VARCHAR(100) NOT NULL,
    allocation_weight NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    yield_recovered NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    multiplier NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    settlement_status VARCHAR(20) CHECK (settlement_status IN ('WON', 'LOST')) NOT NULL,
    game_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL
);

-- Game sessions indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_date ON public.game_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON public.game_sessions(game_identifier);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(settlement_status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status ON public.game_sessions(user_id, settlement_status);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_game_date ON public.game_sessions(user_id, game_identifier, created_at DESC);

-- ============================================
-- TABLE 3: TRANSACTIONS
-- Tracks real deposits and withdrawals
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    gateway VARCHAR(50) DEFAULT NULL,
    gateway_txid TEXT DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    admin_notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_status ON public.transactions(user_id, transaction_type, status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - PROFILES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "System creates profile on signup"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Prevent profile deletion"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - GAME SESSIONS
-- ============================================

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game sessions"
    ON public.game_sessions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions"
    ON public.game_sessions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their active game sessions"
    ON public.game_sessions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND settlement_status = 'WON')
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Prevent game session deletion"
    ON public.game_sessions FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - TRANSACTIONS
-- ============================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id AND transaction_type = 'deposit');

CREATE POLICY "Prevent transaction modification by users"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (false);

CREATE POLICY "Prevent transaction deletion by users"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    generated_casino_id TEXT;
    generated_referral_code TEXT;
BEGIN
    LOOP
        generated_casino_id := LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE casino_id = generated_casino_id);
    END LOOP;

    LOOP
        generated_referral_code := 'REF' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = generated_referral_code);
    END LOOP;

    INSERT INTO public.profiles (id, username, casino_id, referral_code)
    VALUES (NEW.id, 'Player_' || SUBSTRING(generated_casino_id FROM 1 FOR 6), generated_casino_id, generated_referral_code);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================
-- TRIGGER: Auto-update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION public.update_modified_timestamp()
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

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_timestamp();

DROP TRIGGER IF EXISTS update_transactions_timestamp ON public.transactions;
CREATE TRIGGER update_transactions_timestamp
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_modified_timestamp();

-- ============================================
-- TRIGGER: Auto-complete game sessions
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_game_session_completion()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.settlement_status IN ('WON', 'LOST') AND OLD.settlement_status IS DISTINCT FROM NEW.settlement_status THEN
        NEW.completed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_game_session_complete ON public.game_sessions;
CREATE TRIGGER on_game_session_complete
    BEFORE UPDATE ON public.game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_game_session_completion();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_stats(user_id UUID)
RETURNS TABLE (
    total_sessions BIGINT,
    total_allocated NUMERIC,
    total_recovered NUMERIC,
    net_delta NUMERIC,
    win_count BIGINT,
    lose_count BIGINT,
    current_balance NUMERIC,
    vip_level INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(gs.id)::BIGINT AS total_sessions,
        COALESCE(SUM(gs.allocation_weight), 0) AS total_allocated,
        COALESCE(SUM(gs.yield_recovered), 0) AS total_recovered,
        COALESCE(SUM(gs.yield_recovered), 0) - COALESCE(SUM(gs.allocation_weight), 0) AS net_delta,
        COUNT(gs.id) FILTER (WHERE gs.settlement_status = 'WON')::BIGINT AS win_count,
        COUNT(gs.id) FILTER (WHERE gs.settlement_status = 'LOST')::BIGINT AS lose_count,
        p.balance AS current_balance,
        p.vip_level
    FROM public.profiles p
    LEFT JOIN public.game_sessions gs ON gs.user_id = p.id
    WHERE p.id = user_id
    GROUP BY p.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stats TO authenticated;

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================

ALTER TABLE public.profiles SET (autovacuum_enabled = true, fillfactor = 90);
ALTER TABLE public.game_sessions SET (autovacuum_enabled = true, fillfactor = 85);
ALTER TABLE public.transactions SET (autovacuum_enabled = true, fillfactor = 90);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.game_sessions TO authenticated;
GRANT SELECT, INSERT ON public.transactions TO authenticated;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
