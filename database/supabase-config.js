// ============================================
// EMERALD CASINO - SUPABASE CLIENT CONFIGURATION
// Zero-Serverless-API Architecture
// Supabase.js v2 via CDN (Free Tier Compatible)
// ============================================

// ============================================
// STEP 1: Initialize Supabase Client
// Replace with your actual Supabase project credentials
// ============================================

// Supabase project URL (Found in: Project Settings > API > Project URL)
const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';

// Supabase anon/public key (Found in: Project Settings > API > anon public key)
// This key is SAFE to expose in client-side code (RLS policies protect data)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Create Supabase client instance
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) || 
                 supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Validate client initialization
if (!supabase) {
    console.error('❌ Supabase client failed to initialize. Check CDN script loading.');
} else {
    console.log('✅ Supabase client initialized successfully.');
}

// ============================================
// STEP 2: Real-Time Balance Listener
// Automatically updates top bar balance when profile changes
// ============================================

/**
 * Sets up a real-time listener on the user's profile table
 * Updates the balance display instantly when database changes occur
 * @returns {Object} subscription - For cleanup/unsubscribe
 */
function setupRealTimeBalanceListener() {
    try {
        // Get current authenticated user
        supabase.auth.getUser().then(({ data: { user }, error }) => {
            if (error || !user) {
                console.warn('⚠️ No authenticated user. Balance listener not started.');
                return;
            }

            // Subscribe to real-time changes on user's own profile row
            const subscription = supabase
                .channel('profile-balance-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',           // Only listen for updates
                        schema: 'public',          // Default public schema
                        table: 'profiles',         // Target table
                        filter: `id=eq.${user.id}` // ONLY this user's row (RLS enforced)
                    },
                    (payload) => {
                        try {
                            // Extract new balance from the updated record
                            const newBalance = payload.new.balance;
                            const vipLevel = payload.new.vip_level;
                            
                            // Update the UI balance display
                            updateBalanceDisplay(newBalance, vipLevel);
                            
                            console.log('💰 Balance updated in real-time:', newBalance);
                        } catch (updateError) {
                            console.error('❌ Error processing balance update:', updateError);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('👂 Real-time balance listener active');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('❌ Real-time subscription failed');
                    } else if (status === 'TIMED_OUT') {
                        console.warn('⚠️ Real-time subscription timeout. Check connection.');
                    }
                });

            return subscription;
        });
    } catch (error) {
        console.error('❌ Failed to setup balance listener:', error);
        return null;
    }
}

// ============================================
// STEP 3: Balance Display Updater
// UI helper to refresh top bar balance capsule
// ============================================

/**
 * Updates the balance display element with formatted number
 * @param {number} balance - Current user balance from database
 * @param {number} vipLevel - Current VIP level for styling
 */
function updateBalanceDisplay(balance, vipLevel = 0) {
    try {
        const balanceElement = document.getElementById('balance-display');
        
        if (!balanceElement) {
            console.warn('⚠️ Balance display element not found in DOM');
            return;
        }

        // Format balance to 2 decimal places
        const formattedBalance = parseFloat(balance).toFixed(2);
        
        // Update text content
        balanceElement.textContent = formattedBalance;
        
        // Apply VIP-based styling for premium tiers
        if (vipLevel >= 5) {
            balanceElement.style.color = '#ffd700'; // Gold for VIP
            balanceElement.classList.add('animate-pulse-gold');
        } else {
            balanceElement.style.color = '#00e676'; // Standard mint green
            balanceElement.classList.remove('animate-pulse-gold');
        }
        
        // Add subtle animation to indicate update
        balanceElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            balanceElement.style.transform = 'scale(1)';
        }, 200);
        
    } catch (error) {
        console.error('❌ Error updating balance display:', error);
    }
}

// ============================================
// STEP 4: Database Query Functions
// Reusable async functions for common operations
// ============================================

/**
 * Fetches current user profile data from Supabase
 * @returns {Object} Profile data including balance, vip_level, etc.
 */
async function fetchUserProfile() {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('username, balance, vip_level, referral_id, agent_commission')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        // Update balance display with fetched data
        updateBalanceDisplay(data.balance, data.vip_level);
        
        return data;
        
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
    }
}

/**
 * Submits a new deposit record to the ledger
 * @param {string} gateway - Payment gateway ('bkash', 'nagad', 'usdt')
 * @param {number} amount - Deposit amount
 * @param {string} txid - External transaction ID
 * @returns {Object} Created deposit record
 */
async function submitDeposit(gateway, amount, txid) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('deposits_ledger')
            .insert({
                user_id: user.id,
                gateway: gateway,
                amount: amount,
                txid: txid,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        console.log('✅ Deposit submitted:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Error submitting deposit:', error);
        return null;
    }
}

/**
 * Retrieves game history for current user
 * @param {number} limit - Maximum number of records to fetch
 * @returns {Array} Array of game session records
 */
async function fetchGameHistory(limit = 20) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
            .from('game_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;

        console.log(`📊 Fetched ${data.length} game sessions`);
        return data;
        
    } catch (error) {
        console.error('❌ Error fetching game history:', error);
        return [];
    }
}

// ============================================
// STEP 5: Authentication Helpers
// Simple login/signup/logout functions
// ============================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password (min 8 characters)
 * @returns {Object} Auth data or null on error
 */
async function signUpUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        console.log('✅ User signed up. Profile auto-created by database trigger.');
        // Auto-trigger handle_new_user() creates profile row
        return data;
        
    } catch (error) {
        console.error('❌ Sign up failed:', error.message);
        return null;
    }
}

/**
 * Sign in existing user
 * @param {string} email - Registered email address
 * @param {string} password - Account password
 * @returns {Object} Auth data or null on error
 */
async function signInUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        console.log('✅ User signed in successfully');
        
        // Fetch and display profile immediately after login
        await fetchUserProfile();
        
        // Start real-time balance listener
        setupRealTimeBalanceListener();
        
        return data;
        
    } catch (error) {
        console.error('❌ Sign in failed:', error.message);
        return null;
    }
}

/**
 * Sign out current user
 */
async function signOutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;

        console.log('✅ User signed out');
        
        // Reset balance display
        updateBalanceDisplay(0, 0);
        
    } catch (error) {
        console.error('❌ Sign out failed:', error);
    }
}

// ============================================
// STEP 6: Session Recovery (Auto-login)
// Check if user already has active session on page load
// ============================================

/**
 * Initialize app with existing session if available
 * Called automatically when page loads
 */
async function initializeApp() {
    try {
        // Check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session) {
            console.log('👤 Existing session found. Auto-login...');
            
            // Fetch latest profile data
            await fetchUserProfile();
            
            // Activate real-time balance listener
            setupRealTimeBalanceListener();
            
        } else {
            console.log('🆕 No active session. Showing login screen.');
            // Optional: redirect to login view
        }
        
    } catch (error) {
        console.error('❌ App initialization error:', error);
    }
}

// ============================================
// STEP 7: Auto-Initialize on Page Load
// ============================================

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Emerald Casino - Initializing Supabase client...');
    initializeApp();
});

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// Make functions accessible from other scripts/HTML
// ============================================

window.emeraldDB = {
    fetchUserProfile,
    submitDeposit,
    fetchGameHistory,
    signUpUser,
    signInUser,
    signOutUser,
    setupRealTimeBalanceListener,
    supabase // Expose supabase client directly for advanced usage
};

console.log('✅ Emerald Casino Database Module Loaded');
console.log('📋 Available functions: window.emeraldDB.{functionName}');
