// ============================================
// EMERALD KING - SYSTEM CONFIGURATION
// File: js/config.js
// ============================================

const EMERALD_CONFIG = Object.freeze({
    // Supabase Configuration (REPLACE WITH REAL VALUES)
    SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

    // Application
    APP_NAME: 'Emerald King',
    APP_VERSION: '3.0.0',
    APP_DESCRIPTION: 'High-Frequency Tactical Simulation Platform',

    // Feature Flags
    ENABLE_REALTIME: true,
    ENABLE_LOGGING: true,
    DEMO_MODE: false,

    // Database Tables
    TABLES: {
        PROFILES: 'profiles',
        SESSIONS: 'simulation_sessions',
        TRANSACTIONS: 'node_transactions'
    },

    // Auth Settings
    AUTH: {
        PERSIST_SESSION: true,
        AUTO_REFRESH_TOKEN: true,
        DETECT_SESSION_IN_URL: true,
        STORAGE_KEY: 'emerald-king-auth'
    },

    // UI Settings
    UI: {
        MAX_WIDTH: '450px',
        THEME_COLOR: '#02231c',
        BACKGROUND_COLOR: '#011713',
        ACCENT_MINT: '#00e676',
        ACCENT_GOLD: '#FFD700',
        ACCENT_BLUE: '#00b0ff'
    },

    // Navigation Routes
    ROUTES: {
        HOME: '#home',
        OFFERS: '#offers',
        INVITE: '#invite',
        DEPOSIT: '#deposit',
        PROFILE: '#profile'
    }
});

// Freeze to prevent modifications
Object.freeze(EMERALD_CONFIG);
Object.freeze(EMERALD_CONFIG.AUTH);
Object.freeze(EMERALD_CONFIG.UI);
Object.freeze(EMERALD_CONFIG.ROUTES);
Object.freeze(EMERALD_CONFIG.TABLES);

// Export
window.EMERALD_CONFIG = EMERALD_CONFIG;

console.log('⚙️ Config loaded:', EMERALD_CONFIG.APP_NAME, 'v' + EMERALD_CONFIG.APP_VERSION);
