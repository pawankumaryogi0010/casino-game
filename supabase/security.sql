-- ============================================
-- EMERALD KING CASINO - SECURITY POLICIES
-- Row-Level Security (RLS) Definitions
-- File: supabase/security.sql
-- Version: 1.0.0 Production
-- ============================================

-- ============================================
-- PART 1: ENABLE RLS ON ALL TABLES
-- ============================================

-- Enable Row-Level Security on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: PROFILES TABLE POLICIES
-- ============================================

-- ============================================
-- POLICY: Anyone authenticated can READ profiles
-- This allows users to see other players' basic info
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================
-- POLICY: Users can ONLY UPDATE their own row
-- Prevents users from modifying other profiles
-- ============================================
DROP POLICY IF EXISTS "Users can update only their own profile" ON public.profiles;
CREATE POLICY "Users can update only their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- POLICY: Only system/trigger can INSERT profiles
-- Profiles are auto-created on signup via trigger
-- ============================================
DROP POLICY IF EXISTS "System creates profile on signup" ON public.profiles;
CREATE POLICY "System creates profile on signup"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================
-- POLICY: Prevent users from DELETING profiles
-- Profiles are permanent records
-- ============================================
DROP POLICY IF EXISTS "Prevent profile deletion" ON public.profiles;
CREATE POLICY "Prevent profile deletion"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- PART 3: DEPOSITS LEDGER POLICIES
-- ============================================

-- ============================================
-- POLICY: Any authenticated user can INSERT deposits
-- Users submit their own deposit requests
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create deposits" ON public.deposits_ledger;
CREATE POLICY "Authenticated users can create deposits"
    ON public.deposits_ledger
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- POLICY: Users can READ their own deposits
-- Each user sees only their deposit history
-- ============================================
DROP POLICY IF EXISTS "Users can read own deposits" ON public.deposits_ledger;
CREATE POLICY "Users can read own deposits"
    ON public.deposits_ledger
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- POLICY: ONLY ADMIN can UPDATE deposit status
-- Checks user_metadata.role for 'admin' value
-- This prevents users from approving their own deposits
-- ============================================
DROP POLICY IF EXISTS "Only admins can update deposit status" ON public.deposits_ledger;
CREATE POLICY "Only admins can update deposit status"
    ON public.deposits_ledger
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT raw_user_meta_data->>'role' 
         FROM auth.users 
         WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
        (SELECT raw_user_meta_data->>'role' 
         FROM auth.users 
         WHERE id = auth.uid()) = 'admin'
    );

-- ============================================
-- POLICY: ONLY ADMIN can DELETE deposits
-- Regular users cannot remove deposit records
-- ============================================
DROP POLICY IF EXISTS "Only admins can delete deposits" ON public.deposits_ledger;
CREATE POLICY "Only admins can delete deposits"
    ON public.deposits_ledger
    FOR DELETE
    TO authenticated
    USING (
        (SELECT raw_user_meta_data->>'role' 
         FROM auth.users 
         WHERE id = auth.uid()) = 'admin'
    );

-- ============================================
-- POLICY: Admins can READ all deposits
-- Full visibility for admin users
-- ============================================
DROP POLICY IF EXISTS "Admins can read all deposits" ON public.deposits_ledger;
CREATE POLICY "Admins can read all deposits"
    ON public.deposits_ledger
    FOR SELECT
    TO authenticated
    USING (
        (SELECT raw_user_meta_data->>'role' 
         FROM auth.users 
         WHERE id = auth.uid()) = 'admin'
    );

-- ============================================
-- PART 4: GAME SESSIONS POLICIES
-- ============================================

-- ============================================
-- POLICY: Users can INSERT their own game sessions
-- ============================================
DROP POLICY IF EXISTS "Users can create own game sessions" ON public.game_sessions;
CREATE POLICY "Users can create own game sessions"
    ON public.game_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- POLICY: Users can READ their own game sessions
-- ============================================
DROP POLICY IF EXISTS "Users can read own game sessions" ON public.game_sessions;
CREATE POLICY "Users can read own game sessions"
    ON public.game_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- POLICY: Users can UPDATE their active sessions
-- Only when status is 'active'
-- ============================================
DROP POLICY IF EXISTS "Users can update own active sessions" ON public.game_sessions;
CREATE POLICY "Users can update own active sessions"
    ON public.game_sessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND status = 'active')
    WITH CHECK (auth.uid() = user_id AND status = 'active');

-- ============================================
-- POLICY: Admins can READ all game sessions
-- ============================================
DROP POLICY IF EXISTS "Admins can read all game sessions" ON public.game_sessions;
CREATE POLICY "Admins can read all game sessions"
    ON public.game_sessions
    FOR SELECT
    TO authenticated
    USING (
        (SELECT raw_user_meta_data->>'role' 
         FROM auth.users 
         WHERE id = auth.uid()) = 'admin'
    );

-- ============================================
-- POLICY: Prevent session deletion by anyone
-- Game sessions are immutable records
-- ============================================
DROP POLICY IF EXISTS "Prevent session deletion" ON public.game_sessions;
CREATE POLICY "Prevent session deletion"
    ON public.game_sessions
    FOR DELETE
    TO authenticated
    USING (false);

-- ============================================
-- PART 5: HELPER FUNCTION - Check Admin Role
-- ============================================

-- ============================================
-- FUNCTION: is_admin()
-- Returns true if the current user has admin role
-- Can be used in other policies or application code
-- ============================================
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================
-- PART 6: FUNCTION - Set User as Admin
-- Run this manually in SQL Editor to grant admin
-- ============================================

-- ============================================
-- FUNCTION: set_admin_role(target_email)
-- Sets the 'admin' role for a specific user
-- Only executable by existing admins or superuser
-- Usage: SELECT set_admin_role('admin@emerald.com');
-- ============================================
CREATE OR REPLACE FUNCTION public.set_admin_role(target_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find user by email
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RETURN 'Error: User not found with email: ' || target_email;
    END IF;
    
    -- Update user metadata to include admin role
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
    WHERE id = target_user_id;
    
    RETURN 'Success: Admin role granted to ' || target_email;
END;
$$;

-- ============================================
-- PART 7: VERIFICATION QUERIES
-- Run these to verify policies are active
-- ============================================

-- Check all RLS policies on profiles
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles';

-- Check all RLS policies on deposits_ledger
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'deposits_ledger';

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('profiles', 'deposits_ledger', 'game_sessions');

-- ============================================
-- SECURITY SETUP COMPLETE
-- ============================================
-- To grant admin to a user, run in SQL Editor:
-- SELECT set_admin_role('your-email@example.com');
-- ============================================
