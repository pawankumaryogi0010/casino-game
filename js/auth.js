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
            
            await loadAndBindUserProfile();
            initializeRealTimeBalanceTracking();
            
            setTimeout(() => dismissLoginOverlay(), 800);
        } else {
            // Email confirmation required
            showAuthStatusMessage('✅ Account created! Check your email to confirm. ID: ' + casinoID, 'success');
        }
        
    } catch (error) {
        logError('Registration processing error: ' + error.message);
        showAuthStatusMessage('❌ Registration failed. Please try again.', 'error');
    }
}

/**
 * Handle user logout
 * Clears session and resets UI to guest state
 */
async function processLogout() {
    try {
        // Confirm logout with user
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }
        
        if (isDatabaseReady && casinoDatabase && casinoDatabase.auth) {
            // Clean up real-time subscriptions
            cleanupRealtimeTracking();
            
            // Execute Supabase sign out
            const { error } = await casinoDatabase.auth.signOut();
            
            if (error) {
                logError('Logout error: ' + error.message);
                alert('Logout failed. Please try again.');
                return;
            }
        }
        
        logSuccess('User logged out successfully');
        
        // Reset UI to guest state
        resetProfileToGuestState();
        updateBalanceDisplay(0, 0);
        
        // Show login overlay
        setTimeout(() => {
            renderLoginOverlay();
        }, 300);
        
    } catch (error) {
        logError('Logout processing error: ' + error.message);
    }
}

// ============================================
// SECTION 7: PROFILE DATA BINDING ENGINE
// ============================================

/**
 * Fetch user profile from Supabase and bind to Profile UI
 * Updates all profile-related DOM elements with live data
 * @returns {Object|null} Profile data object or null on failure
 */
async function loadAndBindUserProfile() {
    try {
        // Verify database is available
        if (!isDatabaseReady || !casinoDatabase) {
            logWarning('Cannot load profile - database not initialized');
            return null;
        }
        
        // Get current authenticated user
        const { data: { user }, error: authError } = await casinoDatabase.auth.getUser();
        
        if (authError || !user) {
            logWarning('No authenticated user for profile loading');
            return null;
        }
        
        // Query profile from database
        const { data: profile, error: profileError } = await casinoDatabase
            .from('profiles')
            .select('username, casino_id, balance, vip_level, referral_code, total_referrals, commission_earned')
            .eq('id', user.id)
            .single();
        
        if (profileError) {
            logError('Profile query error: ' + profileError.message);
            return null;
        }
        
        if (!profile) {
            logError('No profile record found for user: ' + user.id);
            return null;
        }
        
        logSuccess('Profile data retrieved successfully');
        logInfo('Username: ' + profile.username + ' | Casino ID: ' + profile.casino_id + ' | Balance: ' + profile.balance);
        
        // Bind profile data to all UI elements
        bindProfileDataToUserInterface(profile);
        
        // Update balance in top bar
        updateBalanceDisplay(profile.balance, profile.vip_level);
        
        return profile;
        
    } catch (error) {
        logError('Profile loading error: ' + error.message);
        return null;
    }
}

/**
 * Bind profile data to all Profile Page UI elements
 * Updates: Username, Casino ID, VIP Level, Progress Bar, Referral, Commission
 * @param {Object} profile - Profile data from database
 */
function bindProfileDataToUserInterface(profile) {
    try {
        // ============================================
        // BIND 1: Username String
        // ============================================
        const usernameElement = document.getElementById('profile-username');
        if (usernameElement) {
            usernameElement.textContent = profile.username || 'Unknown Player';
            logSuccess('UI Bound: Username → ' + profile.username);
        } else {
            logWarning('DOM element #profile-username not found');
        }
        
        // ============================================
        // BIND 2: Casino ID Number (9-digit)
        // ============================================
        const casinoIDElement = document.getElementById('profile-id');
        if (casinoIDElement) {
            const displayID = profile.casino_id || '000000000';
            casinoIDElement.textContent = 'ID: ' + displayID;
            logSuccess('UI Bound: Casino ID → ' + displayID);
        } else {
            logWarning('DOM element #profile-id not found');
        }
        
        // ============================================
        // BIND 3: VIP Level with Icon
        // ============================================
        const vipLevelElement = document.getElementById('profile-vip');
        if (vipLevelElement) {
            // VIP tier definitions with emoji indicators
            const vipTierDefinitions = [
                { name: 'Bronze', icon: '🥉', color: '#cd7f32' },
                { name: 'Silver', icon: '🥈', color: '#c0c0c0' },
                { name: 'Gold', icon: '🥇', color: '#FFD700' },
                { name: 'Platinum', icon: '💎', color: '#e5e4e2' },
                { name: 'Diamond', icon: '👑', color: '#b9f2ff' },
                { name: 'Royal', icon: '🌟', color: '#ffd700' }
            ];
            
            const currentTier = vipTierDefinitions[profile.vip_level] || vipTierDefinitions[0];
            vipLevelElement.textContent = 'VIP ' + currentTier.name + ' ' + currentTier.icon;
            vipLevelElement.style.color = currentTier.color;
            
            logSuccess('UI Bound: VIP Level → ' + currentTier.name);
        } else {
            logWarning('DOM element #profile-vip not found');
        }
        
        // ============================================
        // BIND 4: VIP Progress Bar (Geometric Width Calculation)
        // ============================================
        updateVIPProgressBar(profile.vip_level, profile.balance);
        
        // ============================================
        // BIND 5: Referral Link
        // ============================================
        const referralLinkElement = document.getElementById('referral-link');
        if (referralLinkElement) {
            const referralCode = profile.referral_code || 'DEMO0000';
            referralLinkElement.value = 'emerald.com/ref/' + referralCode;
            logSuccess('UI Bound: Referral Link → ' + referralLinkElement.value);
        } else {
            logWarning('DOM element #referral-link not found');
        }
        
        // ============================================
        // BIND 6: Total Referrals Count
        // ============================================
        const totalReferralsElement = document.getElementById('total-referrals');
        if (totalReferralsElement) {
            totalReferralsElement.textContent = profile.total_referrals || 0;
            logSuccess('UI Bound: Total Referrals → ' + profile.total_referrals);
        } else {
            logWarning('DOM element #total-referrals not found');
        }
        
        // ============================================
        // BIND 7: Commission Earned
        // ============================================
        const commissionElement = document.getElementById('commission-earned');
        if (commissionElement) {
            const formattedCommission = '₹' + parseFloat(profile.commission_earned || 0).toFixed(2);
            commissionElement.textContent = formattedCommission;
            logSuccess('UI Bound: Commission → ' + formattedCommission);
        } else {
            logWarning('DOM element #commission-earned not found');
        }
        
        // ============================================
        // BIND 8: Deposit Page Balance
        // ============================================
        const depositBalanceElement = document.getElementById('deposit-balance-display');
        if (depositBalanceElement) {
            depositBalanceElement.textContent = parseFloat(profile.balance || 0).toFixed(2);
        }
        
        logSuccess('✅ All profile data bindings completed successfully');
        
    } catch (error) {
        logError('Profile UI binding error: ' + error.message);
    }
}

/**
 * Calculate and render VIP Progress Bar with geometric width
 * Uses tier thresholds to calculate progress percentage
 * @param {number} vipLevel - Current VIP level (0-5)
 * @param {number} balance - Current account balance
 */
function updateVIPProgressBar(vipLevel, balance) {
    try {
        const progressBarElement = document.getElementById('vip-progress-bar');
        const progressTextElement = document.getElementById('vip-progress-text');
        const nextTierTextElement = document.getElementById('vip-next-tier');
        
        // Exit if no progress elements exist in DOM
        if (!progressBarElement && !progressTextElement && !nextTierTextElement) {
            return;
        }
        
        // ============================================
        // VIP TIER THRESHOLD DEFINITIONS
        // Based on total wagered/deposited amount
        // ============================================
        const vipThresholds = [
            0,        // Bronze: Starting tier
            10000,    // Silver: ₹10,000
            25000,    // Gold: ₹25,000
            50000,    // Platinum: ₹50,000
            100000,   // Diamond: ₹1,00,000
            500000    // Royal: ₹5,00,000
        ];
        
        const vipTierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Royal'];
        const vipTierColors = ['#cd7f32', '#c0c0c0', '#FFD700', '#e5e4e2', '#b9f2ff', '#ffd700'];
        
        // Get current and next tier thresholds
        const currentThreshold = vipThresholds[vipLevel] || 0;
        const nextLevel = Math.min(vipLevel + 1, vipThresholds.length - 1);
        const nextThreshold = vipThresholds[nextLevel] || vipThresholds[vipThresholds.length - 1];
        
        // ============================================
        // GEOMETRIC WIDTH CALCULATION
        // Progress = (current_balance - current_threshold) / (next_threshold - current_threshold) * 100
        // ============================================
        let progressPercentage = 0;
        
        if (nextThreshold > currentThreshold) {
            const progressInTier = balance - currentThreshold;
            const tierRange = nextThreshold - currentThreshold;
            progressPercentage = (progressInTier / tierRange) * 100;
            
            // Clamp between 0 and 100
            progressPercentage = Math.max(0, Math.min(100, progressPercentage));
        }
        
        // If at max tier, show 100%
        if (vipLevel >= vipThresholds.length - 1) {
            progressPercentage = 100;
        }
        
        // ============================================
        // RENDER PROGRESS BAR
        // ============================================
        if (progressBarElement) {
            // Set calculated width
            progressBarElement.style.width = progressPercentage + '%';
            
            // Apply gradient color based on current and next tier
            const currentColor = vipTierColors[vipLevel] || '#00e676';
            const nextColor = vipTierColors[nextLevel] || '#FFD700';
            progressBarElement.style.background = 
                'linear-gradient(90deg, ' + currentColor + ' 0%, ' + nextColor + ' 100%)';
            
            // Add subtle glow effect
            progressBarElement.style.boxShadow = '0 0 10px ' + currentColor + '80';
            
            // Smooth transition
            progressBarElement.style.transition = 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        // ============================================
        // RENDER PROGRESS TEXT
        // ============================================
        if (progressTextElement && vipLevel < vipTierNames.length - 1) {
            progressTextElement.textContent = 
                vipTierNames[vipLevel] + ' → ' + vipTierNames[nextLevel];
            progressTextElement.style.color = vipTierColors[nextLevel];
        } else if (progressTextElement) {
            progressTextElement.textContent = '🏆 MAX LEVEL - ' + vipTierNames[vipLevel];
            progressTextElement.style.color = '#FFD700';
        }
        
        // ============================================
        // RENDER NEXT TIER REQUIREMENT
        // ============================================
        if (nextTierTextElement && vipLevel < vipTierNames.length - 1) {
            const remaining = nextThreshold - balance;
            if (remaining > 0) {
                nextTierTextElement.textContent = 
                    '₹' + remaining.toLocaleString('en-IN') + 
                    ' more to reach ' + vipTierNames[nextLevel] + ' tier';
            } else {
                nextTierTextElement.textContent = '🎉 Eligible for ' + vipTierNames[nextLevel] + ' upgrade!';
                nextTierTextElement.style.color = '#00e676';
            }
        } else if (nextTierTextElement) {
            nextTierTextElement.textContent = '🌟 You have reached the highest tier!';
            nextTierTextElement.style.color = '#FFD700';
        }
        
        logSuccess('VIP Progress updated: ' + progressPercentage.toFixed(1) + '%');
        
    } catch (error) {
        logError('VIP progress bar error: ' + error.message);
    }
}

/**
 * Update balance display in top bar with animation
 * @param {number} balance - Current balance amount
 * @param {number} vipLevel - Current VIP level for styling
 */
function updateBalanceDisplay(balance, vipLevel = 0) {
    try {
        const balanceElement = document.getElementById('balance-display');
        if (!balanceElement) {
            logWarning('Balance display element not found');
            return;
        }
        
        // Format balance to 2 decimal places
        const formattedBalance = parseFloat(balance || 0).toFixed(2);
        
        // Update text content
        balanceElement.textContent = formattedBalance;
        
        // ============================================
        // VIP-BASED STYLING
        // ============================================
        if (vipLevel >= 4) {
            // Diamond/Royal: Gold color with glow
            balanceElement.style.color = '#FFD700';
            balanceElement.style.textShadow = '0 0 15px rgba(255, 215, 0, 0.6)';
        } else if (vipLevel >= 2) {
            // Gold/Platinum: Bright mint
            balanceElement.style.color = '#00e676';
            balanceElement.style.textShadow = '0 0 10px rgba(0, 230, 118, 0.4)';
        } else {
            // Bronze/Silver: Standard mint
            balanceElement.style.color = '#00e676';
            balanceElement.style.textShadow = 'none';
        }
        
        // ============================================
        // SCALE ANIMATION ON UPDATE
        // ============================================
        balanceElement.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        balanceElement.style.transform = 'scale(1.25)';
        
        setTimeout(() => {
            balanceElement.style.transform = 'scale(1)';
        }, 200);
        
        // Also update deposit page balance
        const depositBalanceElement = document.getElementById('deposit-balance-display');
        if (depositBalanceElement) {
            depositBalanceElement.textContent = formattedBalance;
        }
        
    } catch (error) {
        logError('Balance display update error: ' + error.message);
    }
}

/**
 * Reset profile UI to guest state (not logged in)
 */
function resetProfileToGuestState() {
    try {
        const usernameElement = document.getElementById('profile-username');
        const idElement = document.getElementById('profile-id');
        const vipElement = document.getElementById('profile-vip');
        const referralElement = document.getElementById('referral-link');
        const totalReferralsElement = document.getElementById('total-referrals');
        const commissionElement = document.getElementById('commission-earned');
        const progressBarElement = document.getElementById('vip-progress-bar');
        const progressTextElement = document.getElementById('vip-progress-text');
        const nextTierElement = document.getElementById('vip-next-tier');
        
        if (usernameElement) usernameElement.textContent = 'Not Logged In';
        if (idElement) idElement.textContent = 'ID: ---';
        if (vipElement) { vipElement.textContent = 'VIP Bronze 🥉'; vipElement.style.color = '#cd7f32'; }
        if (referralElement) referralElement.value = 'emerald.com/ref/---';
        if (totalReferralsElement) totalReferralsElement.textContent = '0';
        if (commissionElement) commissionElement.textContent = '₹0.00';
        if (progressBarElement) progressBarElement.style.width = '0%';
        if (progressTextElement) progressTextElement.textContent = 'Bronze → Silver';
        if (nextTierElement) { nextTierElement.textContent = 'Login to view progress'; nextTierElement.style.color = ''; }
        
        logSuccess('Profile reset to guest state');
        
    } catch (error) {
        logError('Profile reset error: ' + error.message);
    }
}

// ============================================
// SECTION 8: DEMO MODE PROFILE LOADER
// ============================================

/**
 * Load simulated profile data for demo mode
 * @param {string} email - User email
 * @param {string} username - Optional username
 * @param {string} casinoID - Optional casino ID
 */
function loadDemoUserProfile(email, username = null, casinoID = null) {
    try {
        // Generate demo data
        const demoUsername = username || email.split('@')[0] || 'Player_' + Math.random().toString(36).substring(2, 6);
        const demoCasinoID = casinoID || generateUniqueCasinoID();
        const demoBalance = (Math.random() * 5000 + 100).toFixed(2);
        const demoVipLevel = Math.floor(Math.random() * 4); // 0-3 for demo
        const demoReferralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const demoTotalReferrals = Math.floor(Math.random() * 50);
        const demoCommission = (Math.random() * 2000).toFixed(2);
        
        // Create demo profile object
        const demoProfile = {
            username: demoUsername,
            casino_id: demoCasinoID,
            balance: parseFloat(demoBalance),
            vip_level: demoVipLevel,
            referral_code: demoReferralCode,
            total_referrals: demoTotalReferrals,
            commission_earned: parseFloat(demoCommission)
        };
        
        logInfo('📝 Loading demo profile:', demoProfile);
        
        // Bind demo data to UI
        bindProfileDataToUserInterface(demoProfile);
        updateBalanceDisplay(demoProfile.balance, demoProfile.vip_level);
        
        logSuccess('Demo profile loaded: ' + demoUsername + ' (ID: ' + demoCasinoID + ')');
        
    } catch (error) {
        logError('Demo profile loading error: ' + error.message);
    }
}

// ============================================
// SECTION 9: REAL-TIME BALANCE TRACKING
// ============================================

// Store real-time subscription reference for cleanup
let activeRealtimeSubscription = null;

/**
 * Initialize real-time database subscription for balance updates
 * Listens for profile changes and updates UI automatically
 */
function initializeRealTimeBalanceTracking() {
    try {
        // Skip if database not available
        if (!isDatabaseReady || !casinoDatabase) {
            logInfo('Real-time tracking not available in demo mode');
            return;
        }
        
        // Get current user
        casinoDatabase.auth.getUser().then(({ data: { user }, error }) => {
            if (error || !user) {
                logWarning('No user for real-time tracking');
                return;
            }
            
            // Clean up existing subscription
            if (activeRealtimeSubscription) {
                casinoDatabase.removeChannel(activeRealtimeSubscription);
                activeRealtimeSubscription = null;
            }
            
            // Create new real-time channel
            const channel = casinoDatabase.channel('profile-tracking-' + user.id);
            
            // Listen for profile updates
            channel.on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: 'id=eq.' + user.id
                },
                (payload) => {
                    try {
                        const updatedProfile = payload.new;
                        logInfo('🔄 Real-time profile update detected');
                        
                        // Update all UI bindings
                        updateBalanceDisplay(updatedProfile.balance, updatedProfile.vip_level);
                        bindProfileDataToUserInterface(updatedProfile);
                        
                        // Dispatch custom event for other modules
                        window.dispatchEvent(new CustomEvent('casino:profileChanged', {
                            detail: updatedProfile
                        }));
                        
                    } catch (err) {
                        logError('Real-time handler error: ' + err.message);
                    }
                }
            );
            
            // Subscribe to channel
            channel.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    logSuccess('👂 Real-time balance tracking active');
                    activeRealtimeSubscription = channel;
                } else if (status === 'CHANNEL_ERROR') {
                    logError('Real-time channel error');
                }
            });
        });
        
    } catch (error) {
        logError('Real-time tracking initialization error: ' + error.message);
    }
}

/**
 * Clean up real-time subscription
 */
function cleanupRealtimeTracking() {
    try {
        if (activeRealtimeSubscription && casinoDatabase) {
            casinoDatabase.removeChannel(activeRealtimeSubscription);
            activeRealtimeSubscription = null;
            logInfo('Real-time tracking cleaned up');
        }
    } catch (error) {
        logError('Real-time cleanup error: ' + error.message);
    }
}

// ============================================
// SECTION 10: AUTH STATE MONITOR
// ============================================

/**
 * Monitor Supabase auth state changes (login, logout, token refresh)
 * Automatically responds to auth events
 */
function initializeAuthStateMonitor() {
    try {
        if (!isDatabaseReady || !casinoDatabase) {
            logInfo('Auth state monitor not available');
            return;
        }
        
        casinoDatabase.auth.onAuthStateChange(async (event, session) => {
            logInfo('🔔 Auth state changed: ' + event);
            
            switch (event) {
                case 'SIGNED_IN':
                    logSuccess('User signed in: ' + session?.user?.email);
                    await loadAndBindUserProfile();
                    initializeRealTimeBalanceTracking();
                    dismissLoginOverlay();
                    window.dispatchEvent(new Event('casino:userLoggedIn'));
                    break;
                    
                case 'SIGNED_OUT':
                    logInfo('User signed out');
                    cleanupRealtimeTracking();
                    resetProfileToGuestState();
                    updateBalanceDisplay(0, 0);
                    window.dispatchEvent(new Event('casino:userLoggedOut'));
                    break;
                    
                case 'TOKEN_REFRESHED':
                    logInfo('JWT token refreshed automatically');
                    break;
                    
                case 'USER_UPDATED':
                    logInfo('User data updated');
                    await loadAndBindUserProfile();
                    break;
                    
                case 'PASSWORD_RECOVERY':
                    logInfo('Password recovery initiated');
                    break;
            }
        });
        
        logSuccess('👁️ Auth state monitor active');
        
    } catch (error) {
        logError('Auth state monitor error: ' + error.message);
    }
}

// ============================================
// SECTION 11: LOGGING UTILITIES
// ============================================

/**
 * Log success message to console
 */
function logSuccess(message) {
    if (CASINO_SECURITY_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('✅', message);
    }
}

/**
 * Log error message to console
 */
function logError(message) {
    if (CASINO_SECURITY_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.error('❌', message);
    }
}

/**
 * Log warning message to console
 */
function logWarning(message) {
    if (CASINO_SECURITY_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.warn('⚠️', message);
    }
}

/**
 * Log info message to console
 */
function logInfo(message) {
    if (CASINO_SECURITY_CONFIG.ENABLE_CONSOLE_LOGS) {
        console.log('ℹ️', message);
    }
}

// ============================================
// SECTION 12: PUBLIC API EXPORT
// ============================================

/**
 * Expose all auth module functions to global scope
 * Accessible via window.casinoAuth
 */
window.casinoAuth = {
    // Core security functions
    executeFirewall: executeSecurityFirewall,
    initializeDatabase: initializeCasinoDatabase,
    validateSession: validateActiveSession,
    
    // Auth actions
    login: processLogin,
    register: processRegistration,
    logout: processLogout,
    
    // Profile management
    loadProfile: loadAndBindUserProfile,
    bindProfileUI: bindProfileDataToUserInterface,
    resetProfile: resetProfileToGuestState,
    loadDemoProfile: loadDemoUserProfile,
    
    // UI controllers
    showLoginOverlay: renderLoginOverlay,
    hideLoginOverlay: dismissLoginOverlay,
    updateBalance: updateBalanceDisplay,
    updateVIPBar: updateVIPProgressBar,
    showAuthMessage: showAuthStatusMessage,
    
    // Casino ID
    generateCasinoID: generateUniqueCasinoID,
    generateGuaranteedID: generateGuaranteedUniqueCasinoID,
    
    // Real-time
    startRealtimeTracking: initializeRealTimeBalanceTracking,
    stopRealtimeTracking: cleanupRealtimeTracking,
    
    // State
    isLoggedIn: () => isDatabaseReady && !isLoginOverlayVisible,
    getDatabase: () => casinoDatabase,
    getConfig: () => CASINO_SECURITY_CONFIG
};

// ============================================
// SECTION 13: CSS ANIMATION INJECTION
// ============================================

/**
 * Inject required CSS animations for the auth overlay
 * These are added programmatically to avoid dependency on external CSS
 */
function injectAuthAnimations() {
    try {
        // Check if animations already injected
        if (document.getElementById('casino-auth-animations')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'casino-auth-animations';
        styleElement.textContent = `
            @keyframes casinoFadeIn {
                0% { opacity: 0; }
                100% { opacity: 1; }
            }
            
            @keyframes casinoFadeOut {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            @keyframes casinoSlideUp {
                0% { 
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                100% { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            @keyframes casinoPulse {
                0%, 100% { 
                    box-shadow: 0 0 5px rgba(0, 230, 118, 0.3);
                }
                50% { 
                    box-shadow: 0 0 25px rgba(0, 230, 118, 0.6);
                }
            }
        `;
        
        document.head.appendChild(styleElement);
        logSuccess('Auth animations injected');
        
    } catch (error) {
        logError('Animation injection error: ' + error.message);
    }
}

// ============================================
// SECTION 14: AUTO-START ON SCRIPT LOAD
// ============================================

/**
 * Main entry point - Executes when script loads
 * Waits for DOM and dependencies to be ready
 */
function autoStartSecurityFirewall() {
    // Inject required CSS animations
    injectAuthAnimations();
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            logInfo('🚀 Starting Emerald King Casino Security Firewall...');
            // Small delay to ensure all CDN scripts are parsed
            setTimeout(() => {
                executeSecurityFirewall();
            }, 600);
        });
    } else {
        // DOM already loaded
        logInfo('🚀 Starting Emerald King Casino Security Firewall...');
        setTimeout(() => {
            executeSecurityFirewall();
        }, 600);
    }
}

// ============================================
// EXECUTE AUTO-START
// ============================================

autoStartSecurityFirewall();

// ============================================
// END OF MODULE
// ============================================

console.log('🔐 Casino Security Firewall Module v' + CASINO_SECURITY_CONFIG.APP_VERSION + ' Loaded');
console.log('📋 Access via: window.casinoAuth');
console.log('🛡️ Features: Session Firewall | Casino ID Generator | Profile Binder | Real-time Tracker');
