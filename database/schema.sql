-- ============================================
-- EMERALD KING - SKILL GAMING PLATFORM
-- Complete Database Schema v3.0
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL DEFAULT 'Player',
    metrics_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (metrics_balance >= 0),
    total_bonus_today NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (total_bonus_today >= 0),
    current_vip_level INTEGER NOT NULL DEFAULT 0 CHECK (current_vip_level >= 0 AND current_vip_level <= 5),
    referral_id TEXT UNIQUE NOT NULL,
    total_referrals INTEGER NOT NULL DEFAULT 0,
    commission_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_referral_id ON public.profiles(referral_id);
CREATE INDEX IF NOT EXISTS idx_profiles_vip_level ON public.profiles(current_vip_level);

-- ============================================
-- TABLE: simulation_sessions
-- ============================================
CREATE TABLE IF NOT EXISTS public.simulation_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    engine_identifier VARCHAR(100) NOT NULL,
    allocation_weight NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    yield_recovered NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    multiplier NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    settlement_status VARCHAR(20) CHECK (settlement_status IN ('WON', 'LOST')) NOT NULL,
    session_data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.simulation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.simulation_sessions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_engine ON public.simulation_sessions(engine_identifier);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.simulation_sessions(settlement_status);

-- ============================================
-- TABLE: node_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.node_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    flow_type VARCHAR(20) NOT NULL CHECK (flow_type IN ('DEPOSIT', 'WITHDRAWAL')),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('bkash', 'nagad', 'usdt', 'upi', 'bank')),
    asset_value NUMERIC(14, 2) NOT NULL CHECK (asset_value > 0),
    system_trx_id TEXT UNIQUE NOT NULL,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_notes TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.node_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.node_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.node_transactions(verification_status);
CREATE INDEX IF NOT EXISTS idx_transactions_trx_id ON public.node_transactions(system_trx_id);

-- ============================================
-- TRIGGER: Auto-update balance on session settlement
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_session_settlement()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.settlement_status IN ('WON', 'LOST') AND OLD.settlement_status IS DISTINCT FROM NEW.settlement_status THEN
        NEW.settled_at = NOW();
        
        IF NEW.settlement_status = 'WON' THEN
            UPDATE public.profiles 
            SET metrics_balance = metrics_balance + NEW.yield_recovered,
                updated_at = NOW()
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_session_settled ON public.simulation_sessions;
CREATE TRIGGER on_session_settled
    BEFORE UPDATE ON public.simulation_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_session_settlement();

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
    generated_referral TEXT;
BEGIN
    LOOP
        generated_referral := 'REF' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_id = generated_referral);
    END LOOP;

    INSERT INTO public.profiles (id, username, referral_id)
    VALUES (NEW.id, 'Player_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 6), generated_referral);

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

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_transactions_timestamp ON public.node_transactions;
CREATE TRIGGER update_transactions_timestamp BEFORE UPDATE ON public.node_transactions FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.node_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "System creates profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Prevent profile delete" ON public.profiles FOR DELETE TO authenticated USING (false);

-- Sessions RLS
CREATE POLICY "Users read own sessions" ON public.simulation_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.simulation_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own active sessions" ON public.simulation_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Prevent session delete" ON public.simulation_sessions FOR DELETE TO authenticated USING (false);

-- Transactions RLS
CREATE POLICY "Users read own transactions" ON public.node_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create deposits" ON public.node_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND flow_type = 'DEPOSIT');
CREATE POLICY "Prevent transaction modify by users" ON public.node_transactions FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Prevent transaction delete by users" ON public.node_transactions FOR DELETE TO authenticated USING (false);

-- ============================================
-- PERFORMANCE
-- ============================================
ALTER TABLE public.profiles SET (autovacuum_enabled = true, fillfactor = 90);
ALTER TABLE public.simulation_sessions SET (autovacuum_enabled = true, fillfactor = 85);
ALTER TABLE public.node_transactions SET (autovacuum_enabled = true, fillfactor = 90);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.simulation_sessions TO authenticated;
GRANT SELECT, INSERT ON public.node_transactions TO authenticated;
