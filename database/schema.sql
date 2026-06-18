-- ============================================
-- EMERALD KING CASINO - DATABASE SCHEMA
-- Supabase PostgreSQL (Free Tier Compatible)
-- Elite Production-Grade Migration Script
-- Version: 2.0.0 Production
-- ============================================

-- ============================================
-- EXTENSION SETUP
-- ============================================

-- Enable UUID generation for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions for secure operations
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: PROFILES
-- Core user profiles linked to Supabase auth
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary key references Supabase auth.users table
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Display username for the casino platform
    username TEXT NOT NULL DEFAULT 'Player',
    
    -- Unique 9-digit casino identifier generated on signup
    casino_id TEXT UNIQUE NOT NULL,
    
    -- Player wallet balance with precision for real-money transactions
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00 
        CHECK (balance >= 0),
    
    -- VIP loyalty tier level (0=Bronze, 1=Silver, 2=Gold, 3=Platinum, 4=Diamond, 5=Royal)
    vip_level INTEGER NOT NULL DEFAULT 0 
        CHECK (vip_level >= 0 AND vip_level <= 5),
    
    -- Unique referral code for player invite system
    referral_code TEXT UNIQUE NOT NULL,
    
    -- Total number of referred players
    total_referrals INTEGER NOT NULL DEFAULT 0 
        CHECK (total_referrals >= 0),
    
    -- Accumulated commission earnings from referrals
    commission_earned NUMERIC(14, 2) NOT NULL DEFAULT 0.00 
        CHECK (commission_earned >= 0),
    
    -- Timestamps for record tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE 2: DEPOSITS LEDGER
-- Immutable transaction log for all deposits
-- ============================================

CREATE TABLE IF NOT EXISTS public.deposits_ledger (
    -- Unique transaction identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to the user who initiated deposit
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Deposit amount in user's currency
    amount NUMERIC(14, 2) NOT NULL 
        CHECK (amount > 0),
    
    -- Payment gateway used for transaction
    gateway TEXT NOT NULL 
        CHECK (gateway IN ('bkash', 'nagad', 'usdt', 'upi', 'bank')),
    
    -- External transaction ID from payment processor (must be unique)
    txid TEXT UNIQUE NOT NULL,
    
    -- Current processing status
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    
    -- Admin notes for manual review
    admin_notes TEXT DEFAULT NULL,
    
    -- Automatic timestamp on record creation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Timestamp when status was last updated
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE 3: GAME SESSIONS
-- Complete history of every game played
-- ============================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
    -- Unique session identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to the player
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Identifier for the specific game played
    game_id TEXT NOT NULL,
    
    -- Amount wagered by user in this session
    bet_amount NUMERIC(14, 2) NOT NULL 
        CHECK (bet_amount >= 0),
    
    -- Net result (positive=won, negative=lost, 0=draw/break-even)
    win_loss NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    -- Session status tracking
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'completed', 'cancelled')),
    
    -- Game-specific metadata stored as JSON
    game_data JSONB DEFAULT '{}',
    
    -- Automatic timestamp on session creation
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- When the session was completed
    completed_at TIMESTAMPTZ DEFAULT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_casino_id ON public.profiles(casino_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_vip_level ON public.profiles(vip_level);

-- Deposits indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits_ledger(status);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON public.deposits_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user_status ON public.deposits_ledger(user_id, status);

-- Game sessions indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON public.game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_timestamp ON public.game_sessions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_timestamp ON public.game_sessions(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant data isolation - CRITICAL
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES RLS POLICIES
-- ============================================

-- Allow users to read ONLY their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles 
    FOR SELECT 
    USING (auth.uid() = id);

-- Allow users to update their own profile (balance and commission protected)
CREATE POLICY "Users can update own profile"
    ON public.profiles 
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only system triggers can insert profiles (auto-created on signup)
CREATE POLICY "System creates profile on signup"
    ON public.profiles 
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Prevent users from deleting their own profile
CREATE POLICY "Prevent profile deletion"
    ON public.profiles 
    FOR DELETE 
    USING (false);

-- ============================================
-- DEPOSITS LEDGER RLS POLICIES
-- ============================================

-- Users can view ONLY their own deposits
CREATE POLICY "Users can view own deposits"
    ON public.deposits_ledger 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create their own deposit records
CREATE POLICY "Users can create own deposits"
    ON public.deposits_ledger 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users cannot update deposit records (immutable ledger)
CREATE POLICY "Prevent deposit updates by users"
    ON public.deposits_ledger 
    FOR UPDATE 
    USING (false);

-- Users cannot delete deposit records
CREATE POLICY "Prevent deposit deletion by users"
    ON public.deposits_ledger 
    FOR DELETE 
    USING (false);

-- ============================================
-- GAME SESSIONS RLS POLICIES
-- ============================================

-- Users can view ONLY their own game sessions
CREATE POLICY "Users can view own game sessions"
    ON public.game_sessions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create their own game sessions
CREATE POLICY "Users can create game sessions"
    ON public.game_sessions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own active game sessions
CREATE POLICY "Users can update own active sessions"
    ON public.game_sessions 
    FOR UPDATE 
    USING (auth.uid() = user_id AND status = 'active')
    WITH CHECK (auth.uid() = user_id);

-- Users cannot delete game sessions
CREATE POLICY "Prevent session deletion by users"
    ON public.game_sessions 
    FOR DELETE 
    USING (false);

-- ============================================
-- TRIGGER: Auto-Create Profile on Signup
-- Generates casino_id and referral_code
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
    -- Generate unique 9-digit casino ID
    LOOP
        generated_casino_id := LPAD(FLOOR(RANDOM() * 999999999)::TEXT, 9, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE casino_id = generated_casino_id
        );
    END LOOP;
    
    -- Generate unique referral code
    LOOP
        generated_referral_code := 'REF' || SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE referral_code = generated_referral_code
        );
    END LOOP;
    
    -- Create profile record
    INSERT INTO public.profiles (
        id, 
        username, 
        casino_id, 
        referral_code
    ) VALUES (
        NEW.id,
        'Player_' || SUBSTRING(generated_casino_id FROM 1 FOR 6),
        generated_casino_id,
        generated_referral_code
    );
    
    RETURN NEW;
END;
$$;

-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Attach trigger to auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================
-- TRIGGER: Auto-Update Timestamps
-- Updates updated_at column on record modification
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

-- Apply to profiles table
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_modified_timestamp();

-- Apply to deposits_ledger table
DROP TRIGGER IF EXISTS update_deposits_timestamp ON public.deposits_ledger;
CREATE TRIGGER update_deposits_timestamp
    BEFORE UPDATE ON public.deposits_ledger
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_modified_timestamp();

-- ============================================
-- TRIGGER: Auto-Complete Game Sessions
-- Sets completed_at when status changes to 'completed'
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_game_session_completion()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
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
-- FUNCTION: Get User Dashboard Stats
-- Aggregated data for profile dashboard
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(user_id UUID)
RETURNS TABLE (
    total_deposits NUMERIC,
    total_withdrawals NUMERIC,
    total_games_played BIGINT,
    total_wagered NUMERIC,
    net_profit_loss NUMERIC,
    current_balance NUMERIC,
    vip_level INTEGER,
    total_referrals INTEGER,
    commission_earned NUMERIC
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN dl.status = 'success' THEN dl.amount ELSE 0 END), 0) AS total_deposits,
        0 AS total_withdrawals,
        COUNT(gs.id) AS total_games_played,
        COALESCE(SUM(gs.bet_amount), 0) AS total_wagered,
        COALESCE(SUM(gs.win_loss), 0) AS net_profit_loss,
        p.balance AS current_balance,
        p.vip_level,
        p.total_referrals,
        p.commission_earned
    FROM public.profiles p
    LEFT JOIN public.deposits_ledger dl ON dl.user_id = p.id
    LEFT JOIN public.game_sessions gs ON gs.user_id = p.id
    WHERE p.id = user_id
    GROUP BY p.id;
END;
$$;

-- ============================================
-- FUNCTION: Update VIP Level Based on Activity
-- Auto-promotes users based on total wagered
-- ============================================

CREATE OR REPLACE FUNCTION public.update_vip_level()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    total_wagered NUMERIC;
    new_vip_level INTEGER;
BEGIN
    -- Calculate total wagered by this user
    SELECT COALESCE(SUM(bet_amount), 0) INTO total_wagered
    FROM public.game_sessions
    WHERE user_id = NEW.user_id;
    
    -- Determine VIP level based on thresholds
    IF total_wagered >= 500000 THEN
        new_vip_level := 5;
    ELSIF total_wagered >= 100000 THEN
        new_vip_level := 4;
    ELSIF total_wagered >= 50000 THEN
        new_vip_level := 3;
    ELSIF total_wagered >= 25000 THEN
        new_vip_level := 2;
    ELSIF total_wagered >= 10000 THEN
        new_vip_level := 1;
    ELSE
        new_vip_level := 0;
    END IF;
    
    -- Update profile if VIP level changed
    UPDATE public.profiles
    SET vip_level = new_vip_level
    WHERE id = NEW.user_id AND vip_level != new_vip_level;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_vip_upgrade ON public.game_sessions;
CREATE TRIGGER check_vip_upgrade
    AFTER INSERT ON public.game_sessions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_vip_level();

-- ============================================
-- PERFORMANCE CONFIGURATION
-- ============================================

-- Enable automatic VACUUM for all tables (free tier optimization)
ALTER TABLE public.profiles SET (autovacuum_enabled = true);
ALTER TABLE public.deposits_ledger SET (autovacuum_enabled = true);
ALTER TABLE public.game_sessions SET (autovacuum_enabled = true);

-- Set fillfactor for high-update tables
ALTER TABLE public.profiles SET (fillfactor = 90);
ALTER TABLE public.deposits_ledger SET (fillfactor = 95);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.deposits_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.game_sessions TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_stats TO authenticated;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Run in Supabase SQL Editor:
-- https://app.supabase.com/project/YOUR_PROJECT_ID/sql
