-- ============================================
-- REAL KING CASINO - COMPLETE DATABASE SCHEMA
-- Supabase PostgreSQL Schema v2.0.0
-- Tables: users, game_history, transactions, referrals, game_settings
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE 1: users
-- Purpose: Store user account information
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    balance NUMERIC(16, 2) NOT NULL DEFAULT 1000.00 CHECK (balance >= 0),
    total_won NUMERIC(16, 2) NOT NULL DEFAULT 0,
    total_lost NUMERIC(16, 2) NOT NULL DEFAULT 0,
    total_bets NUMERIC(16, 2) NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT false,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- ============================================
-- TABLE 2: game_history
-- Purpose: Track all game plays for history and analytics
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_id TEXT NOT NULL,
    game_name TEXT NOT NULL,
    bet_amount NUMERIC(16, 2) NOT NULL CHECK (bet_amount > 0),
    result TEXT NOT NULL DEFAULT 'loss' CHECK (result IN ('win', 'loss', 'tie')),
    win_amount NUMERIC(16, 2) NOT NULL DEFAULT 0 CHECK (win_amount >= 0),
    multiplier NUMERIC(10, 2),
    duration_seconds INTEGER,
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for game_history
CREATE INDEX IF NOT EXISTS idx_game_history_user ON public.game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_user_date ON public.game_history(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_game ON public.game_history(game_id);
CREATE INDEX IF NOT EXISTS idx_game_history_result ON public.game_history(result);

-- ============================================
-- TABLE 3: transactions
-- Purpose: Track all money movements
-- ============================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'win', 'loss', 'bonus')),
    amount NUMERIC(16, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    previous_balance NUMERIC(16, 2) NOT NULL,
    new_balance NUMERIC(16, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    payment_method TEXT CHECK (payment_method IN ('cashfree', 'upi', 'card', 'manual', 'nagad', 'bkash', 'usdt')),
    transaction_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- ============================================
-- TABLE 4: referrals
-- Purpose: Track referral program
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    commission_earned NUMERIC(16, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);

-- ============================================
-- TABLE 5: game_settings
-- Purpose: Store RTP and configuration for each game
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id TEXT UNIQUE NOT NULL,
    game_name TEXT NOT NULL,
    rtp NUMERIC(5, 3) NOT NULL CHECK (rtp > 0 AND rtp <= 1),
    min_bet NUMERIC(16, 2) NOT NULL DEFAULT 10.00,
    max_bet NUMERIC(16, 2) NOT NULL DEFAULT 10000.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    thumbnail TEXT,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for game_settings
CREATE INDEX IF NOT EXISTS idx_game_settings_active ON public.game_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_game_settings_category ON public.game_settings(category);

-- ============================================
-- INITIAL GAME_SETTINGS DATA (20 Games)
-- ============================================
INSERT INTO public.game_settings (game_id, game_name, rtp, min_bet, max_bet, description, thumbnail, category) VALUES
    ('aviator', 'Aviator', 0.991, 10.00, 10000.00, 'Crash game with exponential multiplier', '✈️', 'Arcade'),
    ('roulette', 'Roulette', 0.973, 10.00, 10000.00, 'European roulette wheel', '🎡', 'Table'),
    ('blackjack', 'Blackjack', 0.995, 10.00, 10000.00, 'Classic 21 card game', '🃏', 'Card'),
    ('baccarat', 'Baccarat', 0.989, 10.00, 10000.00, 'Player vs Banker card game', '🎴', 'Card'),
    ('teen-patti', 'Teen Patti', 0.968, 10.00, 10000.00, 'Indian 3-card poker', '♠️', 'Card'),
    ('andar-bahar', 'Andar Bahar', 0.945, 10.00, 10000.00, 'Andar vs Bahar card game', '🎯', 'Card'),
    ('dragon-tiger', 'Dragon Tiger', 0.975, 10.00, 10000.00, 'Dragon vs Tiger battle', '🐉', 'Card'),
    ('sic-bo', 'Sic Bo', 0.950, 10.00, 10000.00, 'Three dice betting game', '🎲', 'Dice'),
    ('hi-low', 'Hi-Low', 0.962, 10.00, 10000.00, 'Card prediction game', '🔼', 'Card'),
    ('red-dog', 'Red Dog', 0.948, 10.00, 10000.00, 'Card spread betting', '🐕', 'Card'),
    ('video-poker', 'Video Poker', 0.978, 10.00, 10000.00, 'Jacks or Better poker', '🃏', 'Poker'),
    ('jhandi-munda', 'Jhandi Munda', 0.952, 10.00, 10000.00, 'Traditional 6-dice game', '🎲', 'Dice'),
    ('7up-7down', '7 Up 7 Down', 0.938, 10.00, 10000.00, 'Two dice sum game', '🎲', 'Dice'),
    ('wheel-fortune', 'Wheel of Fortune', 0.955, 10.00, 10000.00, 'Spinning prize wheel', '🎡', 'Wheel'),
    ('keno-jackpot', 'Keno Jackpot', 0.940, 10.00, 10000.00, 'Number lottery game', '🔢', 'Lottery'),
    ('ludo-betting', 'Ludo Betting', 0.940, 10.00, 10000.00, 'Dice race betting', '🎲', 'Board'),
    ('car-roulette', 'Car Roulette', 0.960, 10.00, 10000.00, '6-car racing game', '🏎️', 'Race'),
    ('plinko', 'Plinko', 0.972, 10.00, 10000.00, 'Ball drop physics game', '🔵', 'Arcade'),
    ('mines', 'Mines', 0.965, 10.00, 10000.00, 'Grid mine detection', '💣', 'Arcade'),
    ('classic-slots', 'Classic Slots', 0.965, 10.00, 10000.00, '777 slot machine', '🎰', 'Slot')
ON CONFLICT (game_id) DO UPDATE SET
    game_name = EXCLUDED.game_name,
    rtp = EXCLUDED.rtp,
    min_bet = EXCLUDED.min_bet,
    max_bet = EXCLUDED.max_bet,
    description = EXCLUDED.description,
    thumbnail = EXCLUDED.thumbnail,
    category = EXCLUDED.category;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger 1: Auto-update users.updated_at on any change
CREATE OR REPLACE FUNCTION public.update_user_timestamp()
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

DROP TRIGGER IF EXISTS trg_users_timestamp ON public.users;
CREATE TRIGGER trg_users_timestamp 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION public.update_user_timestamp();

-- Trigger 2: Auto-create referral stats when user signs up with referral code
CREATE OR REPLACE FUNCTION public.handle_referral_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- If user was referred, create referral record
    IF NEW.referred_by IS NOT NULL THEN
        INSERT INTO public.referrals (referrer_id, referred_id, commission_percentage)
        VALUES (NEW.referred_by, NEW.id, 10.00);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_referral_signup ON public.users;
CREATE TRIGGER trg_referral_signup
    AFTER INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_referral_signup();

-- Trigger 3: Validate game_history entries (prevent future dates, negative amounts)
CREATE OR REPLACE FUNCTION public.validate_game_history()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Prevent future dates
    IF NEW.played_at > NOW() THEN
        RAISE EXCEPTION 'played_at cannot be in the future';
    END IF;
    
    -- Prevent negative bet amounts
    IF NEW.bet_amount <= 0 THEN
        RAISE EXCEPTION 'bet_amount must be positive';
    END IF;
    
    -- Ensure win_amount is consistent with result
    IF NEW.result = 'loss' AND NEW.win_amount > 0 THEN
        RAISE EXCEPTION 'win_amount must be 0 for loss result';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_game_history ON public.game_history;
CREATE TRIGGER trg_validate_game_history
    BEFORE INSERT ON public.game_history
    FOR EACH ROW EXECUTE FUNCTION public.validate_game_history();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function 1: get_user_stats(user_id)
-- Returns aggregated stats for a user
CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id UUID)
RETURNS TABLE(
    total_games BIGINT,
    wins BIGINT,
    losses BIGINT,
    ties BIGINT,
    total_wagered NUMERIC,
    total_won NUMERIC,
    net_profit NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        COUNT(*)::BIGINT AS total_games,
        COUNT(*) FILTER (WHERE result = 'win')::BIGINT AS wins,
        COUNT(*) FILTER (WHERE result = 'loss')::BIGINT AS losses,
        COUNT(*) FILTER (WHERE result = 'tie')::BIGINT AS ties,
        COALESCE(SUM(bet_amount), 0) AS total_wagered,
        COALESCE(SUM(win_amount), 0) AS total_won,
        COALESCE(SUM(win_amount) - SUM(bet_amount), 0) AS net_profit
    FROM public.game_history
    WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_stats(UUID) TO authenticated;

-- Function 2: get_leaderboard(p_limit)
-- Returns top users by total winnings
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
    rank BIGINT,
    user_id UUID,
    username TEXT,
    total_won NUMERIC,
    games_played INTEGER,
    win_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        ROW_NUMBER() OVER (ORDER BY u.total_won DESC)::BIGINT AS rank,
        u.id AS user_id,
        u.username,
        u.total_won,
        u.games_played,
        CASE 
            WHEN u.games_played > 0 THEN 
                ROUND((COUNT(h.id) FILTER (WHERE h.result = 'win')::NUMERIC / u.games_played::NUMERIC) * 100, 2)
            ELSE 0
        END AS win_rate
    FROM public.users u
    LEFT JOIN public.game_history h ON u.id = h.user_id
    GROUP BY u.id, u.username, u.total_won, u.games_played
    ORDER BY u.total_won DESC
    LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(INTEGER) TO authenticated;

-- Function 3: update_user_balance(user_id, amount)
-- Safe balance update with transaction recording
CREATE OR REPLACE FUNCTION public.update_user_balance(
    p_user_id UUID,
    p_amount NUMERIC,
    p_type TEXT DEFAULT 'win',
    p_description TEXT DEFAULT NULL
)
RETURNS NUMERIC
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    -- Lock the row for update
    SELECT balance INTO v_old_balance
    FROM public.users
    WHERE id = p_user_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_old_balance + p_amount;
    
    -- Prevent negative balance
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Update user balance
    UPDATE public.users
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Record transaction
    INSERT INTO public.transactions (
        user_id, type, amount, description,
        previous_balance, new_balance, status
    ) VALUES (
        p_user_id, p_type, ABS(p_amount), p_description,
        v_old_balance, v_new_balance, 'completed'
    );
    
    RETURN v_new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_balance(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

-- Function 4: record_game_result
-- Records a game result and updates user stats atomically
CREATE OR REPLACE FUNCTION public.record_game_result(
    p_user_id UUID,
    p_game_id TEXT,
    p_game_name TEXT,
    p_bet_amount NUMERIC,
    p_result TEXT,
    p_win_amount NUMERIC DEFAULT 0,
    p_multiplier NUMERIC DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_history_id UUID;
    v_balance_change NUMERIC;
BEGIN
    -- Insert game history
    INSERT INTO public.game_history (
        user_id, game_id, game_name, bet_amount,
        result, win_amount, multiplier
    ) VALUES (
        p_user_id, p_game_id, p_game_name, p_bet_amount,
        p_result, p_win_amount, p_multiplier
    )
    RETURNING id INTO v_history_id;
    
    -- Update user stats
    UPDATE public.users
    SET 
        total_bets = total_bets + p_bet_amount,
        games_played = games_played + 1,
        total_won = CASE WHEN p_result = 'win' THEN total_won + p_win_amount ELSE total_won END,
        total_lost = CASE WHEN p_result = 'loss' THEN total_lost + p_bet_amount ELSE total_lost END,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Update balance based on result
    IF p_result = 'win' AND p_win_amount > 0 THEN
        v_balance_change := p_win_amount - p_bet_amount;
        PERFORM public.update_user_balance(p_user_id, v_balance_change, 'win', 'Game win: ' || p_game_name);
    ELSIF p_result = 'loss' THEN
        PERFORM public.update_user_balance(p_user_id, -p_bet_amount, 'loss', 'Game loss: ' || p_game_name);
    END IF;
    
    RETURN v_history_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_game_result(UUID, TEXT, TEXT, NUMERIC, TEXT, NUMERIC, NUMERIC) TO authenticated;

-- Function 5: is_admin()
-- Returns true if the current user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT raw_user_meta_data->>'role' 
         FROM auth.users 
         WHERE id = auth.uid()) = 'admin',
        false
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Function 6: set_admin_role(target_email)
-- Grants admin role to a user
CREATE OR REPLACE FUNCTION public.set_admin_role(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RETURN 'Error: User not found with email: ' || target_email;
    END IF;
    
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
    WHERE id = target_user_id;
    
    RETURN 'Success: Admin role granted to ' || target_email;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own profile
DROP POLICY IF EXISTS "Users read own profile" ON public.users;
CREATE POLICY "Users read own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());

-- Users can update their own profile
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users insert own profile" ON public.users;
CREATE POLICY "Users insert own profile"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Prevent profile deletion
DROP POLICY IF EXISTS "Prevent profile delete" ON public.users;
CREATE POLICY "Prevent profile delete"
    ON public.users FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- GAME_HISTORY TABLE POLICIES
-- ============================================

-- Users can read their own game history
DROP POLICY IF EXISTS "Users read own game history" ON public.game_history;
CREATE POLICY "Users read own game history"
    ON public.game_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Users can insert their own game history
DROP POLICY IF EXISTS "Users insert own game history" ON public.game_history;
CREATE POLICY "Users insert own game history"
    ON public.game_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Prevent game history modification
DROP POLICY IF EXISTS "Prevent game history modify" ON public.game_history;
CREATE POLICY "Prevent game history modify"
    ON public.game_history FOR UPDATE
    TO authenticated
    USING (false);

-- Prevent game history deletion
DROP POLICY IF EXISTS "Prevent game history delete" ON public.game_history;
CREATE POLICY "Prevent game history delete"
    ON public.game_history FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================

-- Users can read their own transactions
DROP POLICY IF EXISTS "Users read own transactions" ON public.transactions;
CREATE POLICY "Users read own transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

-- Users can insert their own transactions (deposits)
DROP POLICY IF EXISTS "Users create own transactions" ON public.transactions;
CREATE POLICY "Users create own transactions"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Only admin can update transactions
DROP POLICY IF EXISTS "Only admin update transactions" ON public.transactions;
CREATE POLICY "Only admin update transactions"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Prevent transaction deletion
DROP POLICY IF EXISTS "Prevent transaction delete" ON public.transactions;
CREATE POLICY "Prevent transaction delete"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- REFERRALS TABLE POLICIES
-- ============================================

-- Users can read their own referrals
DROP POLICY IF EXISTS "Users read own referrals" ON public.referrals;
CREATE POLICY "Users read own referrals"
    ON public.referrals FOR SELECT
    TO authenticated
    USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.is_admin());

-- System can insert referrals
DROP POLICY IF EXISTS "System insert referrals" ON public.referrals;
CREATE POLICY "System insert referrals"
    ON public.referrals FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Prevent referral modification
DROP POLICY IF EXISTS "Prevent referral modify" ON public.referrals;
CREATE POLICY "Prevent referral modify"
    ON public.referrals FOR UPDATE
    TO authenticated
    USING (false);

-- Prevent referral deletion
DROP POLICY IF EXISTS "Prevent referral delete" ON public.referrals;
CREATE POLICY "Prevent referral delete"
    ON public.referrals FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- GAME_SETTINGS TABLE POLICIES
-- ============================================

-- Anyone authenticated can read game settings
DROP POLICY IF EXISTS "Anyone read game settings" ON public.game_settings;
CREATE POLICY "Anyone read game settings"
    ON public.game_settings FOR SELECT
    TO authenticated
    USING (true);

-- Only admin can manage game settings
DROP POLICY IF EXISTS "Only admin manage game settings" ON public.game_settings;
CREATE POLICY "Only admin manage game settings"
    ON public.game_settings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin update game settings" ON public.game_settings;
CREATE POLICY "Only admin update game settings"
    ON public.game_settings FOR UPDATE
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "Only admin delete game settings" ON public.game_settings;
CREATE POLICY "Only admin delete game settings"
    ON public.game_settings FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- PERFORMANCE OPTIMIZATION
-- ============================================
ALTER TABLE public.users SET (autovacuum_enabled = true, fillfactor = 90);
ALTER TABLE public.game_history SET (autovacuum_enabled = true, fillfactor = 85);
ALTER TABLE public.transactions SET (autovacuum_enabled = true, fillfactor = 90);
ALTER TABLE public.referrals SET (autovacuum_enabled = true, fillfactor = 90);
ALTER TABLE public.game_settings SET (autovacuum_enabled = true, fillfactor = 95);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;

-- Users table
GRANT SELECT, UPDATE ON public.users TO authenticated;

-- Game history
GRANT SELECT, INSERT ON public.game_history TO authenticated;

-- Transactions
GRANT SELECT, INSERT ON public.transactions TO authenticated;

-- Referrals
GRANT SELECT ON public.referrals TO authenticated;

-- Game settings (public read-only)
GRANT SELECT ON public.game_settings TO authenticated;

-- ============================================
-- VERIFICATION QUERIES (for debugging)
-- ============================================

-- Check all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check all RLS policies
-- SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Check game settings data
-- SELECT game_id, game_name, rtp FROM public.game_settings ORDER BY game_id;

-- ============================================
-- SCHEMA SETUP COMPLETE
-- ============================================
-- To grant admin to a user:
-- SELECT set_admin_role('your-email@example.com');
-- ============================================
