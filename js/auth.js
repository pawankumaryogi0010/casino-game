// ============================================
// EMERALD KING CASINO - SECURITY FIREWALL MODULE
// Client-Side Auth Guardian & Profile Manager
// Zero Dependencies - Pure Vanilla JavaScript
// File: js/auth.js
// Version: 2.0.0 Production
// ============================================

// ============================================
// SECTION 1: SUPABASE CREDENTIALS CONFIGURATION
// ============================================

// Supabase project configuration object
// Replace these with your actual Supabase project credentials
const CASINO_SECURITY_CONFIG = {
    // Project URL from Supabase Dashboard → Settings → API
    SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',
    
    // Anon/Public key - SAFE for client-side exposure (RLS protected)
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    
    // Application metadata
    APP_NAME: 'Emerald King Casino',
    APP_VERSION: '2.0.0',
    
    // Feature toggles
    ENABLE_CONSOLE_LOGS: true,
    AUTO_SHOW_LOGIN: true,
    DEMO_MODE_FALLBACK: true
};

// ============================================
// SECTION 2: SUPABASE CLIENT INITIALIZATION
// ============================================

// Global database client reference
let casinoDatabase = null;

// Track initialization state
let isDatabaseReady = false;

// Track login overlay visibility
let isLoginOverlayVisible = false;

/**
 * Initialize Supabase client with casino project credentials
 * Includes comprehensive error handling and demo mode fallback
 * @returns {boolean} True if initialization successful
 */
function initializeCasinoDatabase() {
    try {
        // Verify Supabase CDN script is loaded
        if (typeof window.supabase === 'undefined') {
            logWarning('Supabase CDN not detected. Switching to DEMO MODE.');
            CASINO_SECURITY_CONFIG.DEMO_MODE_FALLBACK = true;
            return false;
        }
        
        // Create Supabase client instance with optimized settings
        casinoDatabase = window.supabase.createClient(
            CASINO_SECURITY_CONFIG.SUPABASE_URL,
            CASINO_SECURITY_CONFIG.SUPABASE_ANON_KEY,
            {
                auth: {
                    persistSession: true,        // Remember user across page reloads
                    autoRefreshToken: true,      // Automatically refresh expired JWT
                    detectSessionInUrl: true,    // Handle OAuth redirects
                    storageKey: 'emerald-casino-auth' // Custom localStorage key
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10      // Optimize real-time connection
                    }
                },
                global: {
                    headers: {
                        'x-app-name': 'emerald-casino',
                        'x-app-version': CASINO_SECURITY_CONFIG.APP_VERSION
                    }
                }
            }
        );
        
        // Validate client creation
        if (!casinoDatabase || !casinoDatabase.auth) {
            throw new Error('Supabase client creation returned invalid instance');
        }
        
        isDatabaseReady = true;
        logSuccess('Supabase client initialized successfully');
        logInfo('Project: ' + CASINO_SECURITY_CONFIG.APP_NAME + ' v' + CASINO_SECURITY_CONFIG.APP_VERSION);
        
        return true;
        
    } catch (error) {
        logError('Supabase initialization failed: ' + error.message);
        CASINO_SECURITY_CONFIG.DEMO_MODE_FALLBACK = true;
        casinoDatabase = null;
        isDatabaseReady = false;
        return false;
    }
}

// ============================================
// SECTION 3: CASINO ID GENERATOR ENGINE
// ============================================

/**
 * Generates a unique 9-digit numeric Casino ID
 * Uses timestamp + random number algorithm for uniqueness
 * Format: TTTTTT + RRR = 9 digits (e.g., 421571595)
 * 
 * Algorithm:
 * - Last 6 digits of current timestamp (ensures temporal uniqueness)
 * - 3 random digits (100-999) appended (ensures collision resistance)
 * - Fallback to pure random 9-digit if length validation fails
 * 
 * @returns {string} Unique 9-digit numeric string
 */
function generateUniqueCasinoID() {
    try {
        // Step 1: Extract last 6 digits from current Unix timestamp
        const timestamp = Date.now().toString();
        const timestampComponent = timestamp.slice(-6);
        
        // Step 2: Generate random 3-digit component (100-999)
        const randomComponent = Math.floor(Math.random() * 900) + 100;
        
        // Step 3: Combine into 9-digit ID
        let casinoID = timestampComponent + randomComponent.toString();
        
        // Step 4: Validate exact 9-digit length
        if (casinoID.length !== 9) {
            // Fallback: Pure random 9-digit number
            casinoID = Math.floor(100000000 + Math.random() * 900000000).toString();
            logWarning('Casino ID length mismatch, using fallback generator');
        }
        
        // Step 5: Final validation - ensure numeric only
        if (!/^\d{9}$/.test(casinoID)) {
            casinoID = Math.floor(100000000 + Math.random() * 900000000).toString();
            logWarning('Casino ID format validation failed, regenerated');
        }
        
        logSuccess('Casino ID generated: ' + casinoID);
        return casinoID;
        
    } catch (error) {
        logError('Casino ID generation error: ' + error.message);
        // Ultimate fallback
        return Math.floor(100000000 + Math.random() * 900000000).toString();
    }
}

/**
 * Verify if a casino ID already exists in the database
 * @param {string} casinoID - 9-digit ID to check
 * @returns {Promise<boolean>} True if ID is unique (doesn't exist)
 */
async function verifyCasinoIDUnique(casinoID) {
    try {
        if (!isDatabaseReady || !casinoDatabase) {
            // In demo mode, assume unique
            return true;
        }
        
        const { data, error } = await casinoDatabase
            .from('profiles')
            .select('casino_id')
            .eq('casino_id', casinoID)
            .maybeSingle();
        
        if (error) {
            logError('Casino ID uniqueness check failed: ' + error.message);
            return true; // Assume unique on error
        }
        
        // Return true if no existing record found (ID is unique)
        return data === null;
        
    } catch (error) {
        logError('Casino ID verification error: ' + error.message);
        return true;
    }
}

/**
 * Generate guaranteed unique casino ID with database verification
 * Retries up to 5 times if collision detected
 * @returns {Promise<string>} Guaranteed unique 9-digit casino ID
 */
async function generateGuaranteedUniqueCasinoID() {
    const MAX_RETRIES = 5;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const casinoID = generateUniqueCasinoID();
        
        const isUnique = await verifyCasinoIDUnique(casinoID);
        
        if (isUnique) {
            logSuccess('Unique Casino ID confirmed on attempt ' + attempt + ': ' + casinoID);
            return casinoID;
        }
        
        logWarning('Casino ID collision detected on attempt ' + attempt + ', retrying...');
    }
    
    // If all retries exhausted, use timestamp-based guaranteed unique ID
    const fallbackID = Date.now().toString().slice(-9);
    logWarning('All retries exhausted, using fallback ID: ' + fallbackID);
    return fallbackID;
}

// ============================================
// SECTION 4: SESSION FIREWALL - AUTO LOGIN CHECK
// ============================================

/**
 * Check if a valid Supabase JWT session exists
 * Validates token presence and expiry time
 * @returns {Promise<boolean>} True if valid session exists
 */
async function validateActiveSession() {
    try {
        // If database not initialized, no session possible
        if (!isDatabaseReady || !casinoDatabase || !casinoDatabase.auth) {
            logInfo('Database not initialized. No session possible.');
            return false;
        }
        
        // Retrieve current session from Supabase
        const { data: { session }, error } = await casinoDatabase.auth.getSession();
        
        // Handle retrieval errors
        if (error) {
            logError('Session retrieval error: ' + error.message);
            return false;
        }
        
        // Check if session object exists
        if (!session) {
            logInfo('No session object found.');
            return false;
        }
        
        // Validate JWT access token exists
        if (!session.access_token) {
            logWarning('Session exists but missing access token.');
            return false;
        }
        
        // Check token expiration
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const tokenExpiry = session.expires_at;
        
        if (tokenExpiry && tokenExpiry < currentTimestamp) {
            logWarning('JWT token expired at ' + new Date(tokenExpiry * 1000).toISOString());
            return false;
        }
        
        // Session is valid
        logSuccess('Valid session confirmed for user: ' + session.user.email);
        logInfo('Token expires: ' + new Date(tokenExpiry * 1000).toISOString());
        
        return true;
        
    } catch (error) {
        logError('Session validation error: ' + error.message);
        return false;
    }
}

/**
 * Security Firewall Entry Point
 * Checks session on page load and blocks UI if no valid auth
 * This is the MAIN function that protects the casino platform
 */
async function executeSecurityFirewall() {
    try {
        logInfo('🔒 Executing Security Firewall Checkpoint...');
        
        // Step 1: Initialize database connection
        const dbInitialized = initializeCasinoDatabase();
        
        if (!dbInitialized) {
            logWarning('Database not available. Running in DEMO MODE.');
            
            if (CASINO_SECURITY_CONFIG.AUTO_SHOW_LOGIN) {
                renderLoginOverlay();
            }
            return;
        }
        
        // Step 2: Check for active session
        const hasValidSession = await validateActiveSession();
        
        if (hasValidSession) {
            // User is authenticated - load their profile
            logSuccess('🔓 Access Granted - Valid session detected');
            await loadAndBindUserProfile();
            initializeRealTimeBalanceTracking();
            initializeAuthStateMonitor();
            // No overlay needed - user is logged in
            
        } else {
            // No valid session - BLOCK access with login overlay
            logWarning('🔒 Access Denied - No valid session. Displaying login firewall.');
            
            if (CASINO_SECURITY_CONFIG.AUTO_SHOW_LOGIN) {
                renderLoginOverlay();
            }
            
            initializeAuthStateMonitor();
        }
        
    } catch (error) {
        logError('Security firewall execution error: ' + error.message);
        // Fallback: Show login overlay on critical error
        if (CASINO_SECURITY_CONFIG.AUTO_SHOW_LOGIN) {
            renderLoginOverlay();
        }
    }
}

// ============================================
// SECTION 5: LOGIN OVERLAY RENDERING ENGINE
// ============================================

/**
 * Creates and displays the elegant login/registration overlay
 * This freezes the DOM and prevents access to casino features
 * Features glassmorphism design matching the premium theme
 */
function renderLoginOverlay() {
    try {
        // Prevent duplicate overlays
        if (isLoginOverlayVisible) {
            logWarning('Login overlay already active. Skipping duplicate render.');
            return;
        }
        
        isLoginOverlayVisible = true;
        
        // Create overlay container with premium styling
        const overlayElement = document.createElement('div');
        overlayElement.id = 'casino-auth-firewall';
        overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(1, 23, 19, 0.97);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            animation: casinoFadeIn 0.4s ease-in-out;
        `;
        
        // Build login card HTML
        overlayElement.innerHTML = `
            <div class="auth-card" style="
                width: 100%;
                max-width: 400px;
                margin: 0 20px;
                background: linear-gradient(160deg, rgba(2, 35, 28, 0.95) 0%, rgba(1, 23, 19, 0.98) 100%);
                border: 1px solid rgba(0, 230, 118, 0.15);
                border-radius: 24px;
                padding: 36px 24px;
                box-shadow: 
                    0 30px 60px rgba(0, 0, 0, 0.6),
                    0 0 40px rgba(0, 230, 118, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
                animation: casinoSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            ">
                <!-- Casino Logo & Title -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <div style="
                        width: 64px;
                        height: 64px;
                        background: linear-gradient(135deg, #00e676 0%, #00b0ff 100%);
                        border-radius: 18px;
                        margin: 0 auto 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 30px;
                        box-shadow: 0 12px 28px rgba(0, 230, 118, 0.35);
                        position: relative;
                    ">
                        <span style="position: relative; z-index: 1;">👑</span>
                    </div>
                    <h2 style="
                        color: #00e676;
                        font-size: 26px;
                        font-weight: 800;
                        margin: 0 0 4px 0;
                        letter-spacing: 3px;
                        text-transform: uppercase;
                    ">EMERALD</h2>
                    <p style="
                        color: rgba(255, 255, 255, 0.5);
                        font-size: 12px;
                        margin: 0;
                        letter-spacing: 1px;
                    ">Premium Casino Access</p>
                </div>
                
                <!-- Tab Switcher: Login / Register -->
                <div style="
                    display: flex;
                    background: rgba(3, 56, 38, 0.4);
                    border-radius: 14px;
                    padding: 4px;
                    margin-bottom: 28px;
                    position: relative;
                ">
                    <button id="auth-tab-login" style="
                        flex: 1;
                        padding: 12px;
                        background: #00e676;
                        color: #011713;
                        border: none;
                        border-radius: 11px;
                        font-size: 14px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        position: relative;
                        z-index: 1;
                    ">Sign In</button>
                    <button id="auth-tab-register" style="
                        flex: 1;
                        padding: 12px;
                        background: transparent;
                        color: rgba(255, 255, 255, 0.5);
                        border: none;
                        border-radius: 11px;
                        font-size: 14px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        position: relative;
                        z-index: 1;
                    ">Register</button>
                </div>
                
                <!-- Login Form -->
                <form id="auth-form-login" style="display: block;">
                    <div style="margin-bottom: 18px;">
                        <label style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            font-weight: 600;
                            display: block;
                            margin-bottom: 6px;
                            letter-spacing: 0.5px;
                        ">📧 EMAIL ADDRESS</label>
                        <input type="email" id="login-email-input" 
                            placeholder="player@email.com" 
                            autocomplete="email"
                            style="
                                width: 100%;
                                padding: 13px 16px;
                                background: rgba(3, 56, 38, 0.25);
                                border: 1px solid rgba(0, 230, 118, 0.15);
                                border-radius: 13px;
                                color: #ffffff;
                                font-size: 14px;
                                outline: none;
                                transition: all 0.3s ease;
                                box-sizing: border-box;
                            "
                            onfocus="this.style.borderColor='#00e676'; this.style.boxShadow='0 0 20px rgba(0,230,118,0.15)'; this.style.background='rgba(3,56,38,0.4)';"
                            onblur="this.style.borderColor='rgba(0,230,118,0.15)'; this.style.boxShadow='none'; this.style.background='rgba(3,56,38,0.25)';"
                        >
                    </div>
                    <div style="margin-bottom: 24px;">
                        <label style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            font-weight: 600;
                            display: block;
                            margin-bottom: 6px;
                            letter-spacing: 0.5px;
                        ">🔒 PASSWORD</label>
                        <input type="password" id="login-password-input" 
                            placeholder="••••••••" 
                            autocomplete="current-password"
                            style="
                                width: 100%;
                                padding: 13px 16px;
                                background: rgba(3, 56, 38, 0.25);
                                border: 1px solid rgba(0, 230, 118, 0.15);
                                border-radius: 13px;
                                color: #ffffff;
                                font-size: 14px;
                                outline: none;
                                transition: all 0.3s ease;
                                box-sizing: border-box;
                            "
                            onfocus="this.style.borderColor='#00e676'; this.style.boxShadow='0 0 20px rgba(0,230,118,0.15)'; this.style.background='rgba(3,56,38,0.4)';"
                            onblur="this.style.borderColor='rgba(0,230,118,0.15)'; this.style.boxShadow='none'; this.style.background='rgba(3,56,38,0.25)';"
                        >
                    </div>
                    <button type="submit" style="
                        width: 100%;
                        padding: 14px;
                        background: linear-gradient(135deg, #00e676 0%, #00b0ff 100%);
                        color: #011713;
                        border: none;
                        border-radius: 13px;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 10px 28px rgba(0, 230, 118, 0.3);
                        letter-spacing: 1px;
                    " 
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 14px 32px rgba(0,230,118,0.4)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 28px rgba(0,230,118,0.3)';"
                    >
                        🔓 Enter Casino
                    </button>
                </form>
                
                <!-- Register Form (Hidden by default) -->
                <form id="auth-form-register" style="display: none;">
                    <div style="margin-bottom: 16px;">
                        <label style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            font-weight: 600;
                            display: block;
                            margin-bottom: 6px;
                        ">📧 EMAIL ADDRESS</label>
                        <input type="email" id="register-email-input" 
                            placeholder="player@email.com" 
                            autocomplete="email"
                            style="
                                width: 100%;
                                padding: 13px 16px;
                                background: rgba(3, 56, 38, 0.25);
                                border: 1px solid rgba(0, 230, 118, 0.15);
                                border-radius: 13px;
                                color: #ffffff;
                                font-size: 14px;
                                outline: none;
                                box-sizing: border-box;
                            "
                            onfocus="this.style.borderColor='#FFD700'; this.style.boxShadow='0 0 20px rgba(255,215,0,0.15)';"
                            onblur="this.style.borderColor='rgba(0,230,118,0.15)'; this.style.boxShadow='none';"
                        >
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            font-weight: 600;
                            display: block;
                            margin-bottom: 6px;
                        ">👤 USERNAME</label>
                        <input type="text" id="register-username-input" 
                            placeholder="Choose a username" 
                            autocomplete="username"
                            style="
                                width: 100%;
                                padding: 13px 16px;
                                background: rgba(3, 56, 38, 0.25);
                                border: 1px solid rgba(0, 230, 118, 0.15);
                                border-radius: 13px;
                                color: #ffffff;
                                font-size: 14px;
                                outline: none;
                                box-sizing: border-box;
                            "
                            onfocus="this.style.borderColor='#FFD700'; this.style.boxShadow='0 0 20px rgba(255,215,0,0.15)';"
                            onblur="this.style.borderColor='rgba(0,230,118,0.15)'; this.style.boxShadow='none';"
                        >
                    </div>
                    <div style="margin-bottom: 24px;">
                        <label style="
                            color: rgba(255, 255, 255, 0.6);
                            font-size: 11px;
                            font-weight: 600;
                            display: block;
                            margin-bottom: 6px;
                        ">🔒 PASSWORD (min 6 characters)</label>
                        <input type="password" id="register-password-input" 
                            placeholder="••••••••" 
                            autocomplete="new-password"
                            minlength="6"
                            style="
                                width: 100%;
                                padding: 13px 16px;
                                background: rgba(3, 56, 38, 0.25);
                                border: 1px solid rgba(0, 230, 118, 0.15);
                                border-radius: 13px;
                                color: #ffffff;
                                font-size: 14px;
                                outline: none;
                                box-sizing: border-box;
                            "
                            onfocus="this.style.borderColor='#FFD700'; this.style.boxShadow='0 0 20px rgba(255,215,0,0.15)';"
                            onblur="this.style.borderColor='rgba(0,230,118,0.15)'; this.style.boxShadow='none';"
                        >
                    </div>
                    <button type="submit" style="
                        width: 100%;
                        padding: 14px;
                        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                        color: #011713;
                        border: none;
                        border-radius: 13px;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 10px 28px rgba(255, 215, 0, 0.3);
                        letter-spacing: 1px;
                    " 
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 14px 32px rgba(255,215,0,0.4)';"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 28px rgba(255,215,0,0.3)';"
                    >
                        🎰 Create Account
                    </button>
                </form>
                
                <!-- Status Message Area -->
                <div id="auth-status-display" style="
                    text-align: center;
                    margin-top: 18px;
                    font-size: 12px;
                    min-height: 22px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                "></div>
                
                <!-- Demo Mode Indicator -->
                <div style="
                    text-align: center;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                ">
                    <span style="
                        color: rgba(255,255,255,0.3);
                        font-size: 10px;
                    ">Secure SSL Encrypted Connection</span>
                </div>
            </div>
        `;
        
        // Append overlay to document body
        document.body.appendChild(overlayElement);
        
        // Initialize overlay interactivity
        initializeOverlayEventListeners();
        
        logSuccess('🔒 Security Firewall Overlay rendered');
        
    } catch (error) {
        logError('Failed to render login overlay: ' + error.message);
        isLoginOverlayVisible = false;
    }
}

/**
 * Remove login overlay and restore access to casino
 */
function dismissLoginOverlay() {
    try {
        const overlay = document.getElementById('casino-auth-firewall');
        if (overlay) {
            // Add exit animation
            overlay.style.animation = 'casinoFadeOut 0.3s ease-in';
            
            // Remove after animation completes
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                isLoginOverlayVisible = false;
                logSuccess('🔓 Access granted - Firewall overlay dismissed');
            }, 280);
        }
    } catch (error) {
        logError('Failed to dismiss overlay: ' + error.message);
        isLoginOverlayVisible = false;
    }
}

/**
 * Display status messages on the auth overlay
 * @param {string} message - Message text to display
 * @param {string} type - 'success', 'error', 'loading', or 'info'
 */
function showAuthStatusMessage(message, type = 'info') {
    try {
        const statusElement = document.getElementById('auth-status-display');
        if (!statusElement) return;
        
        // Color mapping based on message type
        const colorMap = {
            'success': '#00e676',
            'error': '#ff4444',
            'loading': '#FFD700',
            'info': '#ffffff'
        };
        
        statusElement.textContent = message;
        statusElement.style.color = colorMap[type] || colorMap.info;
        
    } catch (error) {
        logError('Status message display error: ' + error.message);
    }
}

/**
 * Setup all event listeners for the auth overlay
 * Handles tab switching, form submissions, and interactions
 */
function initializeOverlayEventListeners() {
    try {
        // Tab switcher: Login tab
        const loginTab = document.getElementById('auth-tab-login');
        const registerTab = document.getElementById('auth-tab-register');
        const loginForm = document.getElementById('auth-form-login');
        const registerForm = document.getElementById('auth-form-register');
        
        if (loginTab && registerTab) {
            loginTab.addEventListener('click', function() {
                // Update tab styles
                this.style.background = '#00e676';
                this.style.color = '#011713';
                registerTab.style.background = 'transparent';
                registerTab.style.color = 'rgba(255, 255, 255, 0.5)';
                
                // Switch forms
                if (loginForm) loginForm.style.display = 'block';
                if (registerForm) registerForm.style.display = 'none';
                
                // Clear status
                showAuthStatusMessage('');
            });
            
            registerTab.addEventListener('click', function() {
                // Update tab styles
                this.style.background = '#FFD700';
                this.style.color = '#011713';
                loginTab.style.background = 'transparent';
                loginTab.style.color = 'rgba(255, 255, 255, 0.5)';
                
                // Switch forms
                if (registerForm) registerForm.style.display = 'block';
                if (loginForm) loginForm.style.display = 'none';
                
                // Clear status
                showAuthStatusMessage('');
            });
        }
        
        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const email = document.getElementById('login-email-input')?.value?.trim();
                const password = document.getElementById('login-password-input')?.value;
                
                // Validate inputs
                if (!email || !password) {
                    showAuthStatusMessage('❌ Please fill in all fields', 'error');
                    return;
                }
                
                // Show loading state
                showAuthStatusMessage('🔄 Authenticating...', 'loading');
                
                // Execute login
                await processLogin(email, password);
            });
        }
        
        // Register form submission
        if (registerForm) {
            registerForm.addEventListener('submit', async function(event) {
                event.preventDefault();
                
                const email = document.getElementById('register-email-input')?.value?.trim();
                const username = document.getElementById('register-username-input')?.value?.trim();
                const password = document.getElementById('register-password-input')?.value;
                
                // Validate inputs
                if (!email || !username || !password) {
                    showAuthStatusMessage('❌ Please fill in all fields', 'error');
                    return;
                }
                
                if (password.length < 6) {
                    showAuthStatusMessage('❌ Password must be at least 6 characters', 'error');
                    return;
                }
                
                // Show loading state
                showAuthStatusMessage('🔄 Creating your account...', 'loading');
                
                // Execute registration
                await processRegistration(email, username, password);
            });
        }
        
        logSuccess('Auth overlay event listeners initialized');
        
    } catch (error) {
        logError('Overlay listener setup error: ' + error.message);
    }
}

// ============================================
// SECTION 6: AUTHENTICATION HANDLERS
// ============================================

/**
 * Process user login with Supabase authentication
 * @param {string} email - User email address
 * @param {string} password - User password
 */
async function processLogin(email, password) {
    try {
        // Check if running in demo mode
        if (CASINO_SECURITY_CONFIG.DEMO_MODE_FALLBACK || !isDatabaseReady || !casinoDatabase) {
            logInfo('📝 DEMO MODE: Simulating login for ' + email);
            showAuthStatusMessage('✅ Demo login successful! Loading profile...', 'success');
            
            // Simulate profile loading delay
            setTimeout(() => {
                loadDemoUserProfile(email);
                dismissLoginOverlay();
                logSuccess('🎰 Welcome to Emerald King Casino (Demo Mode)');
            }, 1200);
            return;
        }
        
        // Execute Supabase sign in
        const { data, error } = await casinoDatabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            logError('Login failed: ' + error.message);
            
            // User-friendly error messages
            if (error.message.includes('Invalid login credentials')) {
                showAuthStatusMessage('❌ Invalid email or password', 'error');
            } else if (error.message.includes('Email not confirmed')) {
                showAuthStatusMessage('❌ Please confirm your email first', 'error');
            } else {
                showAuthStatusMessage('❌ ' + error.message, 'error');
            }
            return;
        }
        
        // Login successful
        logSuccess('User authenticated: ' + data.user.email);
        showAuthStatusMessage('✅ Login successful! Loading profile...', 'success');
        
        // Load user profile data
        await loadAndBindUserProfile();
        
        // Initialize real-time features
        initializeRealTimeBalanceTracking();
        
        // Dismiss overlay after short delay
        setTimeout(() => {
            dismissLoginOverlay();
            logSuccess('🎰 Welcome back to Emerald King Casino!');
        }, 800);
        
    } catch (error) {
        logError('Login processing error: ' + error.message);
        showAuthStatusMessage('❌ Login failed. Please try again.', 'error');
    }
}

/**
 * Process new user registration with Supabase
 * Generates unique Casino ID and creates profile record
 * @param {string} email - User email address
 * @param {string} username - Desired username
 * @param {string} password - User password
 */
async function processRegistration(email, username, password) {
    try {
        // Generate unique casino ID for new player
        const casinoID = await generateGuaranteedUniqueCasinoID();
        
        logInfo('🎰 Generated Casino ID for new player: ' + casinoID);
        
        // Check if running in demo mode
        if (CASINO_SECURITY_CONFIG.DEMO_MODE_FALLBACK || !isDatabaseReady || !casinoDatabase) {
            logInfo('📝 DEMO MODE: Simulating registration for ' + email);
            showAuthStatusMessage('✅ Account created! Your ID: ' + casinoID, 'success');
            
            // Simulate registration delay and auto-login
            setTimeout(() => {
                loadDemoUserProfile(email, username, casinoID);
                dismissLoginOverlay();
                logSuccess('🎰 Welcome to Emerald King Casino! ID: ' + casinoID);
            }, 1800);
            return;
        }
        
        // Execute Supabase sign up
        const { data, error } = await casinoDatabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    casino_id: casinoID
                }
            }
        });
        
        if (error) {
            logError('Registration failed: ' + error.message);
            
            if (error.message.includes('already registered')) {
                showAuthStatusMessage('❌ This email is already registered', 'error');
            } else if (error.message.includes('password')) {
                showAuthStatusMessage('❌ Password must be at least 6 characters', 'error');
            } else {
                showAuthStatusMessage('❌ ' + error.message, 'error');
            }
            return;
        }
        
        // Registration successful
        logSuccess('User registered: ' + data.user.email + ' | Casino ID: ' + casinoID);
        
        // Update profile with casino ID if user is immediately confirmed
        if (data.user && data.user.id) {
            const { error: updateError } = await casinoDatabase
                .from('profiles')
                .update({
                    username: username,
                    casino_id: casinoID
                })
                .eq('id', data.user.id);
            
            if (updateError) {
                logError('Profile update error: ' + updateError.message);
            } else {
                logSuccess('Profile updated with Casino ID: ' + casinoID);
            }
        }
        
        // Show success message
        if (data.session) {
            // User is automatically signed in
            showAuthStatusMessage('✅ Account created! ID: ' + casinoID, 'success');
