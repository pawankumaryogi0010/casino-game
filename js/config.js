// ============================================
// EMERALD KING - SKILL-BASED GAMING PLATFORM
// Supabase Client Configuration
// File: js/config.js
// Version: 3.0.0 Production
// ============================================

// ============================================
// CONFIGURATION OBJECT
// ============================================

const EMERALD_CONFIG = {
    // Supabase project URL
    // Replace with your actual Supabase project URL
    // Found in: Supabase Dashboard → Settings → API → Project URL
    SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',

    // Supabase anonymous/public key
    // This key is SAFE to expose in client-side code
    // RLS policies protect all data access
    // Found in: Supabase Dashboard → Settings → API → anon/public key
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    // Application metadata
    APP_NAME: 'Emerald King',
    APP_VERSION: '3.0.0',
    APP_DESCRIPTION: 'Skill-Based Gaming Platform',

    // Feature toggles
    ENABLE_REALTIME_SUBSCRIPTIONS: true,
    ENABLE_CONSOLE_LOGGING: true,
    DEMO_MODE_FALLBACK: false,

    // Database settings
    DB_SCHEMA: 'public',
    REALTIME_EVENTS_PER_SECOND: 10,

    // Auth settings
    AUTH_PERSIST_SESSION: true,
    AUTH_AUTO_REFRESH_TOKEN: true,
    AUTH_DETECT_SESSION_IN_URL: true,
    AUTH_STORAGE_KEY: 'emerald-king-auth',

    // API endpoints (Supabase auto-generates these)
    API_BASE_URL: 'https://xxxxxxxxxxxx.supabase.co/rest/v1',
    AUTH_BASE_URL: 'https://xxxxxxxxxxxx.supabase.co/auth/v1',

    // Table names
    TABLES: {
        PROFILES: 'profiles',
        GAME_SESSIONS: 'game_sessions',
        TRANSACTIONS: 'transactions'
    }
};

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================

let emeraldDB = null;
let isSupabaseInitialized = false;
let supabaseInitializationError = null;

/**
 * Initialize the Supabase client with credentials from EMERALD_CONFIG
 * Includes comprehensive error handling and demo mode fallback
 * @returns {boolean} True if initialization was successful
 */
function initializeSupabase() {
    try {
        // Verify Supabase CDN script is loaded
        if (typeof window.supabase === 'undefined') {
            console.warn('⚠️ Supabase CDN not detected. Enabling DEMO MODE.');
            console.warn('💡 Add this to your HTML: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
            EMERALD_CONFIG.DEMO_MODE_FALLBACK = true;
            supabaseInitializationError = 'Supabase CDN not loaded';
            return false;
        }

        // Validate configuration
        if (!EMERALD_CONFIG.SUPABASE_URL || EMERALD_CONFIG.SUPABASE_URL.includes('xxxxxxxxxxxx')) {
            console.warn('⚠️ SUPABASE_URL not configured. Enabling DEMO MODE.');
            console.warn('💡 Update js/config.js with your actual Supabase project URL and anon key.');
            EMERALD_CONFIG.DEMO_MODE_FALLBACK = true;
            supabaseInitializationError = 'SUPABASE_URL not configured';
            return false;
        }

        if (!EMERALD_CONFIG.SUPABASE_ANON_KEY || EMERALD_CONFIG.SUPABASE_ANON_KEY.includes('xxxxxxxx')) {
            console.warn('⚠️ SUPABASE_ANON_KEY not configured. Enabling DEMO MODE.');
            EMERALD_CONFIG.DEMO_MODE_FALLBACK = true;
            supabaseInitializationError = 'SUPABASE_ANON_KEY not configured';
            return false;
        }

        // Create Supabase client instance
        emeraldDB = window.supabase.createClient(
            EMERALD_CONFIG.SUPABASE_URL,
            EMERALD_CONFIG.SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: EMERALD_CONFIG.AUTH_PERSIST_SESSION,
                    autoRefreshToken: EMERALD_CONFIG.AUTH_AUTO_REFRESH_TOKEN,
                    detectSessionInUrl: EMERALD_CONFIG.AUTH_DETECT_SESSION_IN_URL,
                    storageKey: EMERALD_CONFIG.AUTH_STORAGE_KEY
                },
                realtime: {
                    params: {
                        eventsPerSecond: EMERALD_CONFIG.REALTIME_EVENTS_PER_SECOND
                    }
                },
                global: {
                    headers: {
                        'x-app-name': EMERALD_CONFIG.APP_NAME.toLowerCase().replace(/\s+/g, '-'),
                        'x-app-version': EMERALD_CONFIG.APP_VERSION
                    }
                }
            }
        );

        // Verify client creation was successful
        if (!emeraldDB || !emeraldDB.auth) {
            throw new Error('Supabase client creation returned invalid instance');
        }

        isSupabaseInitialized = true;
        supabaseInitializationError = null;

        if (EMERALD_CONFIG.ENABLE_CONSOLE_LOGGING) {
            console.log('✅ Supabase client initialized successfully');
            console.log('📋 Project URL:', EMERALD_CONFIG.SUPABASE_URL);
            console.log('🎮 App:', EMERALD_CONFIG.APP_NAME, 'v' + EMERALD_CONFIG.APP_VERSION);
        }

        return true;

    } catch (error) {
        console.error('❌ Supabase initialization failed:', error.message);
        EMERALD_CONFIG.DEMO_MODE_FALLBACK = true;
        emeraldDB = null;
        isSupabaseInitialized = false;
        supabaseInitializationError = error.message;
        return false;
    }
}

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

/**
 * Get a reference to the profiles table
 * @returns {Object} Supabase query builder for profiles table
 */
function getProfilesTable() {
    if (!isSupabaseInitialized || !emeraldDB) {
        throw new Error('Supabase not initialized');
    }
    return emeraldDB.from(EMERALD_CONFIG.TABLES.PROFILES);
}

/**
 * Get a reference to the game_sessions table
 * @returns {Object} Supabase query builder for game_sessions table
 */
function getGameSessionsTable() {
    if (!isSupabaseInitialized || !emeraldDB) {
        throw new Error('Supabase not initialized');
    }
    return emeraldDB.from(EMERALD_CONFIG.TABLES.GAME_SESSIONS);
}

/**
 * Get a reference to the transactions table
 * @returns {Object} Supabase query builder for transactions table
 */
function getTransactionsTable() {
    if (!isSupabaseInitialized || !emeraldDB) {
        throw new Error('Supabase not initialized');
    }
    return emeraldDB.from(EMERALD_CONFIG.TABLES.TRANSACTIONS);
}

/**
 * Check if Supabase is ready for queries
 * @returns {boolean} True if initialized and ready
 */
function isSupabaseReady() {
    return isSupabaseInitialized && emeraldDB !== null && !EMERALD_CONFIG.DEMO_MODE_FALLBACK;
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
async function getCurrentUser() {
    if (!isSupabaseReady()) {
        console.warn('⚠️ Supabase not ready');
        return null;
    }

    try {
        const { data: { user }, error } = await emeraldDB.auth.getUser();
        if (error) {
            console.error('❌ Get user error:', error.message);
            return null;
        }
        return user;
    } catch (error) {
        console.error('❌ Get user exception:', error.message);
        return null;
    }
}

/**
 * Get the current user's profile
 * @returns {Promise<Object|null>} Profile object or null
 */
async function getCurrentProfile() {
    if (!isSupabaseReady()) return null;

    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await getProfilesTable()
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('❌ Get profile error:', error.message);
            return null;
        }

        return data;
    } catch (error) {
        console.error('❌ Get profile exception:', error.message);
        return null;
    }
}

// ============================================
// GLOBAL EXPORT
// ============================================

window.EMERALD_CONFIG = EMERALD_CONFIG;
window.emeraldDB = null; // Will be set after initialization
window.initializeSupabase = initializeSupabase;
window.isSupabaseInitialized = () => isSupabaseInitialized;
window.isSupabaseReady = isSupabaseReady;
window.getProfilesTable = getProfilesTable;
window.getGameSessionsTable = getGameSessionsTable;
window.getTransactionsTable = getTransactionsTable;
window.getCurrentUser = getCurrentUser;
window.getCurrentProfile = getCurrentProfile;

// ============================================
// AUTO-INITIALIZE ON SCRIPT LOAD
// ============================================

(function autoInit() {
    if (EMERALD_CONFIG.ENABLE_CONSOLE_LOGGING) {
        console.log('🚀 ' + EMERALD_CONFIG.APP_NAME + ' v' + EMERALD_CONFIG.APP_VERSION + ' - Config Loaded');
        console.log('📋 EMERALD_CONFIG available at: window.EMERALD_CONFIG');
        console.log('🔧 Run initializeSupabase() to connect to database');
    }

    // Auto-initialize if DOM is already loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
            initializeSupabase();
        }, 100);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                initializeSupabase();
            }, 100);
        });
    }
})();

// ============================================
// END OF CONFIGURATION
// ============================================
