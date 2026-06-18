-- ============================================
-- EMERALD CASINO - DATABASE SCHEMA MIGRATION
-- Supabase PostgreSQL (Free Tier Compatible)
-- Version: 1.0.0
-- ============================================

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: PROFILES
-- User profiles linked to Supabase auth.users
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Primary identifier, references Supabase auth user
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Username for display purposes
    username TEXT UNIQUE NOT NULL,
    
    -- User wallet balance with precision for monetary values
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    
    -- VIP loyalty tier level
    vip_level INTEGER NOT NULL DEFAULT 0 CHECK (vip_level >= 0 AND vip_level <= 10),
    
    -- Unique referral code assigned to this user
    referral_id TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4()::TEXT,
    
    -- Accumulated agent commission earnings
    agent_commission NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (agent_commission >= 0),
    
    -- Timestamp management
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE 2: DEPOSITS LEDGER
-- Complete transaction log for all deposit attempts
-- ============================================

CREATE TABLE IF NOT EXISTS public.deposits_ledger (
    -- Unique transaction identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to the user who made the deposit
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Payment gateway identifier
    gateway TEXT NOT NULL CHECK (gateway IN ('bkash', 'nagad', 'usdt')),
    
    -- Deposit amount requested by user
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    
    -- External transaction ID from payment gateway (MUST be unique)
    txid TEXT UNIQUE NOT NULL,
    
    -- Current processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    
    -- Automatic timestamp on record creation
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster user-specific deposit queries
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits_ledger(user_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits_ledger(status);

-- ============================================
-- TABLE 3: GAME SESSIONS
-- Complete log of every game played by users
-- ============================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
    -- Unique session identifier
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Reference to the player
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Identifier for the specific game played
    game_id TEXT NOT NULL,
    
    -- Amount wagered by user in this session
    bet_amount NUMERIC(12, 2) NOT NULL CHECK (bet_amount >= 0),
    
    -- Net result (positive = won, negative = lost, 0 = draw)
    win_loss_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Session status tracking
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    
    -- Automatic timestamp on session creation
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user game history queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);

-- Index for filtering by game type
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_id ON public.game_sessions(game_id);

-- Compound index for chronological game history
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_time ON public.game_sessions(user_id, timestamp DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Critical for multi-tenant data isolation
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR PROFILES TABLE
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (except balance and commission)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only system/triggers can insert profiles (auto-created on signup)
CREATE POLICY "System creates profile on signup"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- POLICIES FOR DEPOSITS LEDGER TABLE
-- Users can view their own deposits
CREATE POLICY "Users can view own deposits"
    ON public.deposits_ledger FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own deposit records
CREATE POLICY "Users can create own deposits"
    ON public.deposits_ledger FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete deposits (immutable ledger)
-- No UPDATE or DELETE policies = completely blocked

-- POLICIES FOR GAME SESSIONS TABLE
-- Users can view their own game sessions
CREATE POLICY "Users can view own game sessions"
    ON public.game_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own game sessions
CREATE POLICY "Users can create game sessions"
    ON public.game_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users cannot modify completed game sessions
-- No UPDATE or DELETE policies

-- ============================================
-- AUTOMATED TRIGGER: Create Profile on Signup
-- Automatically creates profile row when new auth.users entry is created
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, referral_id)
    VALUES (
        NEW.id,
        'player_' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8),
        'REF' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8) || SUBSTRING(uuid_generate_v4()::TEXT FROM 1 FOR 4)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- AUTOMATED TRIGGER: Update updated_at timestamp
-- Automatically updates the timestamp when profile is modified
-- ============================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if re-running migration
DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;

-- Apply timestamp updater to profiles table
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================

-- Enable VACUUM automatically (good practice for Supabase free tier)
ALTER TABLE public.profiles SET (autovacuum_enabled = true);
ALTER TABLE public.deposits_ledger SET (autovacuum_enabled = true);
ALTER TABLE public.game_sessions SET (autovacuum_enabled = true);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- URL: https://app.supabase.com/project/[YOUR-PROJECT]/sql
