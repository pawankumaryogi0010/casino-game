// ============================================
// EMERALD KING CASINO - SUPABASE CLIENT CONTROLLER
// Zero-Serverless-API Architecture
// Supabase.js v2 via CDN (Free Tier Compatible)
// File: js/supabase-config.js
// Version: 2.0.0 Production
// ============================================

// ============================================
// SECTION 1: ENVIRONMENT CONFIGURATION
// ============================================

/**
 * Supabase project credentials
 * In production, these should come from environment variables
 * or a secure configuration object
 */
const EMERALD_CONFIG = {
    // Supabase project URL - Replace with actual project URL
    SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',
    
    // Supabase anon/public key - SAFE for client-side (RLS enforced)
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    
    // Application settings
    APP_NAME: 'Emerald King Casino',
    APP_VERSION: '2.0.0',
    
    // Feature flags
    ENABLE_REALTIME: true,
    ENABLE_LOGGING: true,
    DEMO_MODE: false
};

// ============================================
// SECTION 2: SUPABASE CLIENT INITIALIZATION
// ============================================

/**
 * Global Supabase client instance
 * Initialized on script load with error handling
 */
let emeraldDB = null;
let realtimeSubscription = null;
let isInitialized = false;

/**
 * Initialize Supabase client with credentials from config
 * @returns {boolean} Success status
 */
function initializeSupabaseClient() {
    try {
        // Validate that Supabase CDN is loaded
        if (typeof window.supabase === 'undefined') {
            console.warn('⚠️ Supabase CDN not loaded. Switching to DEMO MODE.');
            EMERALD_CONFIG.DEMO_MODE = true;
            return false;
        }
        
        // Create Supabase client instance
        emeraldDB = window.supabase.createClient(
            EMERALD_CONFIG.SUPABASE_URL,
            EMERALD_CONFIG.SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            }
        );
        
        // Verify client creation
        if (!emeraldDB || !emeraldDB.auth) {
            throw new Error('Supabase client creation failed');
        }
        
        isInitialized = true;
        
        if (EMERALD_CONFIG.ENABLE_LOGGING) {
            console.log('✅ Supabase client initialized');
            console.log('📋 Project:', EMERALD_CONFIG.APP_NAME, 'v' + EMERALD_CONFIG.APP_VERSION);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error.message);
        EMERALD_CONFIG.DEMO_MODE = true;
        emeraldDB = null;
        isInitialized = false;
        return false;
    }
}

// ============================================
// SECTION 3: REAL-TIME SUBSCRIPTION ENGINE
// ============================================

/**
 * Setup real-time subscription for profile changes
 * Automatically re-renders dashboard when balance/ledger updates
 * @returns {Object|null} Subscription object for cleanup
 */
async function setupRealtimeSubscriptions() {
    try {
        // Skip if Supabase not initialized or realtime disabled
        if (!isInitialized || !emeraldDB || !EMERALD_CONFIG.ENABLE_REALTIME) {
            console.log('ℹ️ Real-time subscriptions not available.');
            return null;
        }
        
        // Get current authenticated user
        const { data: { user }, error: authError } = await emeraldDB.auth.getUser();
        
        if (authError || !user) {
            console.log('ℹ️ No authenticated user. Real-time subscriptions deferred.');
            return null;
        }
        
        // Clean up any existing subscription
        if (realtimeSubscription) {
            await emeraldDB.removeChannel(realtimeSubscription);
            realtimeSubscription = null;
        }
        
        // Create channel for real-time updates
        const channel = emeraldDB.channel('emerald-realtime-' + user.id);
        
        // ============================================
        // SUBSCRIPTION 1: Profile Changes (Balance, VIP)
        // ============================================
        channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${user.id}`
            },
            (payload) => {
                try {
                    if (EMERALD_CONFIG.ENABLE_LOGGING) {
                        console.log('🔄 Profile update detected:', payload.new);
                    }
                    
                    // Extract updated fields
                    const newData = payload.new;
                    
                    // Re-render balance display
                    if (typeof updateBalanceDisplay === 'function') {
                        updateBalanceDisplay(newData.balance, newData.vip_level);
                    }
                    
                    // Re-render profile page if visible
                    if (typeof renderProfileDashboard === 'function') {
                        renderProfileDashboard(newData);
                    }
                    
                    // Update VIP progress bar
                    if (typeof updateVIPProgressBar === 'function') {
                        updateVIPProgressBar(newData.vip_level, newData.balance);
                    }
                    
                    // Update deposit page balance
                    const depositBalanceEl = document.getElementById('deposit-balance-display');
                    if (depositBalanceEl) {
                        depositBalanceEl.textContent = parseFloat(newData.balance).toFixed(2);
                    }
                    
                    // Dispatch custom event for other modules
                    window.dispatchEvent(new CustomEvent('emerald:profileUpdated', {
                        detail: newData
                    }));
                    
                } catch (err) {
                    console.error('❌ Profile realtime handler error:', err);
                }
            }
        );
        
        // ============================================
        // SUBSCRIPTION 2: Deposit Status Changes
        // ============================================
        channel.on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'deposits_ledger',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {
                try {
                    if (EMERALD_CONFIG.ENABLE_LOGGING) {
                        console.log('💰 Deposit status update:', payload.new);
                    }
                    
                    const deposit = payload.new;
                    
                    // Show notification for status changes
                    if (deposit.status === 'success') {
                        showToast('✅ Deposit of ₹' + deposit.amount + ' confirmed!');
                        
                        // Refresh profile to get updated balance
                        if (typeof fetchUserProfile === 'function') {
                            fetchUserProfile();
                        }
                    } else if (deposit.status === 'failed') {
                        showToast('❌ Deposit failed. Please try again.');
                    }
                    
                    // Dispatch custom event
                    window.dispatchEvent(new CustomEvent('emerald:depositUpdated', {
                        detail: deposit
                    }));
                    
                } catch (err) {
                    console.error('❌ Deposit realtime handler error:', err);
                }
            }
        );
        
        // ============================================
        // SUBSCRIPTION 3: New Deposits Created
        // ============================================
        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'deposits_ledger',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {
                try {
                    if (EMERALD_CONFIG.ENABLE_LOGGING) {
                        console.log('📝 New deposit created:', payload.new);
                    }
                    
                    // Show confirmation to user
                    showToast('📝 Deposit request submitted. Waiting for confirmation...');
                    
                    // Dispatch custom event
                    window.dispatchEvent(new CustomEvent('emerald:newDeposit', {
                        detail: payload.new
                    }));
                    
                } catch (err) {
                    console.error('❌ New deposit handler error:', err);
                }
            }
        );
        
        // ============================================
        // SUBSCRIPTION 4: Game Session Updates
        // ============================================
        channel.on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'game_sessions',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => {
                try {
                    if (EMERALD_CONFIG.ENABLE_LOGGING) {
                        console.log('🎮 New game session:', payload.new);
                    }
                    
                    // Dispatch custom event
                    window.dispatchEvent(new CustomEvent('emerald:gameSessionCreated', {
                        detail: payload.new
                    }));
                    
                } catch (err) {
                    console.error('❌ Game session handler error:', err);
                }
            }
        );
        
        // Subscribe to the channel
        const subscription = channel.subscribe((status) => {
            switch (status) {
                case 'SUBSCRIBED':
                    if (EMERALD_CONFIG.ENABLE_LOGGING) {
                        console.log('👂 Real-time subscriptions active for user:', user.id);
                    }
                    break;
                case 'CHANNEL_ERROR':
                    console.error('❌ Real-time channel error');
                    break;
                case 'TIMED_OUT':
                    console.warn('⚠️ Real-time connection timed out');
                    break;
                case 'CLOSED':
                    console.log('🔒 Real-time channel closed');
                    break;
            }
        });
        
        realtimeSubscription = subscription;
        return subscription;
        
    } catch (error) {
        console.error('❌ Real-time setup error:', error);
        return null;
    }
}

/**
 * Cleanup real-time subscriptions
 */
async function cleanupRealtimeSubscriptions() {
    try {
        if (realtimeSubscription && emeraldDB) {
            await emeraldDB.removeChannel(realtimeSubscription);
            realtimeSubscription = null;
            if (EMERALD_CONFIG.ENABLE_LOGGING) {
                console.log('🧹 Real-time subscriptions cleaned up');
            }
        }
    } catch (error) {
        console.error('❌ Cleanup error:', error);
    }
}

// ============================================
// SECTION 4: DATABASE QUERY FUNCTIONS
// ============================================

/**
 * Fetch complete user profile from database
 * @returns {Object|null} Profile data or null on error
 */
async function fetchUserProfile() {
    try {
        if (!isInitialized || !emeraldDB) {
            console.warn('⚠️ Database not available');
            return null;
        }
        
        const { data: { user }, error: authError } = await emeraldDB.auth.getUser();
        
        if (authError || !user) {
            console.log('ℹ️ No authenticated user');
            return null;
        }
        
        const { data, error } = await emeraldDB
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        if (EMERALD_CONFIG.ENABLE_LOGGING) {
            console.log('👤 Profile fetched:', data);
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Profile fetch error:', error);
        return null;
    }
}

/**
 * Submit a new deposit to the ledger
 * @param {string} gateway - Payment gateway
 * @param {number} amount - Deposit amount
 * @param {string} txid - Transaction ID
 * @returns {Object|null} Created deposit record
 */
async function submitDeposit(gateway, amount, txid) {
    try {
        if (!isInitialized || !emeraldDB) {
            throw new Error('Database not available');
        }
        
        const { data: { user }, error: authError } = await emeraldDB.auth.getUser();
        
        if (authError || !user) {
            throw new Error('User not authenticated');
        }
        
        const { data, error } = await emeraldDB
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
        
        if (EMERALD_CONFIG.ENABLE_LOGGING) {
            console.log('✅ Deposit submitted:', data);
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Deposit error:', error);
        return null;
    }
}

/**
 * Fetch user's deposit history
 * @param {number} limit - Max records
 * @returns {Array} Array of deposit records
 */
async function fetchDepositHistory(limit = 20) {
    try {
        if (!isInitialized || !emeraldDB) return [];
        
        const { data: { user }, error: authError } = await emeraldDB.auth.getUser();
        if (authError || !user) return [];
        
        const { data, error } = await emeraldDB
            .from('deposits_ledger')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('❌ Deposit history error:', error);
        return [];
    }
}

/**
 * Fetch user's game history
 * @param {number} limit - Max records
 * @returns {Array} Array of game session records
 */
async function fetchGameHistory(limit = 50) {
    try {
        if (!isInitialized || !emeraldDB) return [];
        
        const { data: { user }, error: authError } = await emeraldDB.auth.getUser();
        if (authError || !user) return [];
        
        const { data, error } = await emeraldDB
            .from('game_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(limit);
        
        if (error) throw error;
        return data || [];
        
    } catch (error) {
        console.error('❌ Game history error:', error);
        return [];
    }
}

/**
 * Get dashboard statistics
 * @returns {Object|null} Aggregated stats
 */
async function fetchDashboardStats() {
    try {
        if (!isInitialized || !emeraldDB) return null;
        
        const { data: { user }, error: authError } = await emeraldDB.auth.getUser();
        if (authError || !user) return null;
        
        const { data, error } = await emeraldDB
            .rpc('get_user_dashboard_stats', { user_id: user.id });
        
        if (error) throw error;
        return data;
        
    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        return null;
    }
}

// ============================================
// SECTION 5: AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign up a new user
 */
async function signUpUser(email, password, username) {
    try {
        if (!isInitialized || !emeraldDB) {
            throw new Error('Database not available');
        }
        
        const { data, error } = await emeraldDB.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { username: username }
            }
        });
        
        if (error) throw error;
        
        if (EMERALD_CONFIG.ENABLE_LOGGING) {
            console.log('✅ User signed up:', data.user.email);
        }
        
        return data;
        
    } catch (error) {
        console.error('❌ Signup error:', error);
        return null;
    }
}

/**
 * Sign in existing user
 */
async function signInUser(email, password) {
    try {
        if (!isInitialized || !emeraldDB) {
            throw new Error('Database not available');
        }
        
        const { data, error } = await emeraldDB.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        if (EMERALD_CONFIG.ENABLE_LOGGING) {
            console.log('✅ User signed in:', data.user.email);
        }
        
        // Setup realtime after login
        await setupRealtimeSubscriptions();
        
        // Fetch profile immediately
        await fetchUserProfile();
        
        return data;
        
    } catch (error) {
        console.error('❌ Login error:', error);
        return null;
    }
}

/**
 * Sign out current user
 */
async function signOutUser() {
    try {
        if (!isInitialized || !emeraldDB) return;
        
        // Cleanup realtime first
        await cleanupRealtimeSubscriptions();
        
        const { error } = await emeraldDB.auth.signOut();
        if (error) throw error;
        
        if (EMERALD_CONFIG.ENABLE_LOGGING) {
            console.log('✅ User signed out');
        }
        
    } catch (error) {
        console.error('❌ Logout error:', error);
    }
}

// ============================================
// SECTION 6: AUTH STATE MONITOR
// ============================================

/**
 * Monitor authentication state changes
 */
function setupAuthStateMonitor() {
    try {
        if (!isInitialized || !emeraldDB) {
            console.log('ℹ️ Auth monitor not available');
            return;
        }
        
        emeraldDB.auth.onAuthStateChange(async (event, session) => {
            if (EMERALD_CONFIG.ENABLE_LOGGING) {
                console.log('🔔 Auth state changed:', event);
            }
            
            switch (event) {
                case 'SIGNED_IN':
                    await setupRealtimeSubscriptions();
                    await fetchUserProfile();
                    window.dispatchEvent(new Event('emerald:userLoggedIn'));
                    break;
                    
                case 'SIGNED_OUT':
                    await cleanupRealtimeSubscriptions();
                    window.dispatchEvent(new Event('emerald:userLoggedOut'));
                    break;
                    
                case 'TOKEN_REFRESHED':
                    if (EMERALD_CONFIG.ENABLE_LOGGING) {
                        console.log('🔄 JWT token refreshed');
                    }
                    break;
                    
                case 'USER_UPDATED':
                    await fetchUserProfile();
                    break;
            }
        });
        
        if (EMERALD_CONFIG.ENABLE_LOGGING) {
            console.log('👁️ Auth state monitor active');
        }
        
    } catch (error) {
        console.error('❌ Auth monitor error:', error);
    }
}

// ============================================
// SECTION 7: UTILITY FUNCTIONS
// ============================================

/**
 * Show toast notification in UI
 */
function showToast(message) {
    try {
        // Check if toast function exists from main script
        if (typeof window.showToast === 'function') {
            window.showToast(message);
            return;
        }
        
        // Fallback: console log
        console.log('🔔 ' + message);
        
        // Simple DOM toast
        const existingToast = document.getElementById('emerald-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.id = 'emerald-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #02231c;
            color: #00e676;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 13px;
            font-weight: bold;
            z-index: 9999;
            border: 1px solid rgba(0, 230, 118, 0.3);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            animation: fadeIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
    } catch (error) {
        console.error('❌ Toast error:', error);
    }
}

/**
 * Render profile data to dashboard UI
 */
function renderProfileDashboard(profile) {
    try {
        if (!profile) return;
        
        // Update username
        const usernameEl = document.getElementById('profile-username');
        if (usernameEl) usernameEl.textContent = profile.username || 'Player';
        
        // Update casino ID
        const idEl = document.getElementById('profile-id');
        if (idEl) idEl.textContent = 'ID: ' + (profile.casino_id || '---');
        
        // Update VIP
        const vipEl = document.getElementById('profile-vip');
        if (vipEl) {
            const titles = ['Bronze 🥉', 'Silver 🥈', 'Gold 🥇', 'Platinum 💎', 'Diamond 👑', 'Royal 🌟'];
            vipEl.textContent = 'VIP ' + (titles[profile.vip_level] || 'Member');
        }
        
        // Update referral
        const refEl = document.getElementById('referral-link');
        if (refEl) refEl.value = 'emerald.com/ref/' + (profile.referral_code || '---');
        
        // Update commission
        const commEl = document.getElementById('commission-earned');
        if (commEl) commEl.textContent = '₹' + parseFloat(profile.commission_earned || 0).toFixed(2);
        
        // Update total referrals
        const totalRefEl = document.getElementById('total-referrals');
        if (totalRefEl) totalRefEl.textContent = profile.total_referrals || 0;
        
    } catch (error) {
        console.error('❌ Render profile error:', error);
    }
}

/**
 * Update balance display in top bar
 */
function updateBalanceDisplay(balance, vipLevel) {
    try {
        const balanceEl = document.getElementById('balance-display');
        if (!balanceEl) return;
        
        balanceEl.textContent = parseFloat(balance).toFixed(2);
        
        // VIP styling
        if (vipLevel >= 4) {
            balanceEl.style.color = '#FFD700';
            balanceEl.style.textShadow = '0 0 10px rgba(255,215,0,0.5)';
        } else {
            balanceEl.style.color = '#00e676';
            balanceEl.style.textShadow = 'none';
        }
        
        // Animation
        balanceEl.style.transform = 'scale(1.3)';
        setTimeout(() => { balanceEl.style.transform = 'scale(1)'; }, 200);
        
    } catch (error) {
        console.error('❌ Update balance error:', error);
    }
}

/**
 * Update VIP progress bar
 */
function updateVIPProgressBar(vipLevel, balance) {
    try {
        const progressBar = document.getElementById('vip-progress-bar');
        const progressText = document.getElementById('vip-progress-text');
        const nextTierText = document.getElementById('vip-next-tier');
        
        if (!progressBar) return;
        
        const thresholds = [0, 10000, 25000, 50000, 100000, 500000];
        const titles = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Royal'];
        
        const currentThreshold = thresholds[vipLevel] || 0;
        const nextThreshold = thresholds[Math.min(vipLevel + 1, thresholds.length - 1)] || 500000;
        
        let percent = 0;
        if (nextThreshold > currentThreshold) {
            percent = Math.min(100, Math.max(0, ((balance - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
        }
        
        progressBar.style.width = percent + '%';
        
        if (progressText && vipLevel < titles.length - 1) {
            progressText.textContent = titles[vipLevel] + ' → ' + titles[vipLevel + 1];
        }
        
        if (nextTierText && vipLevel < titles.length - 1) {
            const remaining = (nextThreshold - balance).toFixed(2);
            nextTierText.textContent = '₹' + remaining + ' more to reach ' + titles[vipLevel + 1] + ' tier';
        }
        
    } catch (error) {
        console.error('❌ VIP progress error:', error);
    }
}

// ============================================
// SECTION 8: SESSION RECOVERY
// ============================================

/**
 * Restore session on page load if exists
 */
async function restoreSession() {
    try {
        if (!isInitialized || !emeraldDB) return false;
        
        const { data: { session }, error } = await emeraldDB.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            if (EMERALD_CONFIG.ENABLE_LOGGING) {
                console.log('🔄 Session restored for:', session.user.email);
            }
            
            // Fetch profile and setup realtime
            await fetchUserProfile();
            await setupRealtimeSubscriptions();
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Session restore error:', error);
        return false;
    }
}

// ============================================
// SECTION 9: PUBLIC API EXPORT
// ============================================

/**
 * Expose all functions to global scope
 */
window.emeraldDB = {
    // Core
    initialize: initializeSupabaseClient,
    isReady: () => isInitialized,
    getClient: () => emeraldDB,
    config: EMERALD_CONFIG,
    
    // Real-time
    setupRealtime: setupRealtimeSubscriptions,
    cleanupRealtime: cleanupRealtimeSubscriptions,
    
    // Database
    fetchProfile: fetchUserProfile,
    submitDeposit: submitDeposit,
    fetchDeposits: fetchDepositHistory,
    fetchGameHistory: fetchGameHistory,
    fetchDashboardStats: fetchDashboardStats,
    
    // Auth
    signUp: signUpUser,
    signIn: signInUser,
    signOut: signOutUser,
    restoreSession: restoreSession,
    
    // UI helpers
    showToast: showToast,
    renderProfile: renderProfileDashboard,
    updateBalance: updateBalanceDisplay,
    updateVIP: updateVIPProgressBar
};

// ============================================
// SECTION 10: AUTO-INITIALIZE ON LOAD
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    if (EMERALD_CONFIG.ENABLE_LOGGING) {
        console.log('🚀 Initializing ' + EMERALD_CONFIG.APP_NAME + ' v' + EMERALD_CONFIG.APP_VERSION);
    }
    
    // Step 1: Initialize Supabase client
    const dbReady = initializeSupabaseClient();
    
    if (!dbReady) {
        console.warn('⚠️ Running in DEMO MODE - No database connection');
        return;
    }
    
    // Step 2: Setup auth state monitor
    setupAuthStateMonitor();
    
    // Step 3: Try to restore existing session
    const hasSession = await restoreSession();
    
    if (!hasSession) {
        console.log('ℹ️ No active session. Waiting for user login.');
    }
    
    if (EMERALD_CONFIG.ENABLE_LOGGING) {
        console.log('✅ ' + EMERALD_CONFIG.APP_NAME + ' ready');
        console.log('📋 Available: window.emeraldDB');
    }
});

// ============================================
// END OF MODULE
// ============================================
