// ============================================
// EMERALD KING CASINO - SECURITY FIREWALL MODULE
// Client-Side Auth Guardian & Profile Manager
// Zero Dependencies - Pure Vanilla JavaScript
// File: js/auth.js
// Version: 2.0.1 - Fixed Signup Flow
// ============================================

// ============================================
// SECTION 1: SUPABASE CREDENTIALS CONFIGURATION
// ============================================

const CASINO_SECURITY_CONFIG = {
    SUPABASE_URL: 'https://oajqlkpcwpmwmwtyibbx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hanFsa3Bjd3Btd213dHlpYmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTkzNjIsImV4cCI6MjA5NzUzNTM2Mn0.kiglACdDNUnAk0nEOPXAgKXDaWjdTg8Rair2grd82Qs',
    APP_NAME: 'Emerald King Casino',
    APP_VERSION: '2.0.1',
    ENABLE_CONSOLE_LOGS: true,
    AUTO_SHOW_LOGIN: true,
    DEMO_MODE_FALLBACK: true
};

// ============================================
// SECTION 2: SUPABASE CLIENT INITIALIZATION
// ============================================

let casinoDatabase = null;
let isDatabaseReady = false;
let isLoginOverlayVisible = false;

function initializeCasinoDatabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            logWarning('Supabase CDN not detected. Switching to DEMO MODE.');
            CASINO_SECURITY_CONFIG.DEMO_MODE_FALLBACK = true;
            return false;
        }
        casinoDatabase = window.supabase.createClient(
            CASINO_SECURITY_CONFIG.SUPABASE_URL,
            CASINO_SECURITY_CONFIG.SUPABASE_ANON_KEY,
            {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'emerald-casino-auth' },
                realtime: { params: { eventsPerSecond: 10 } },
                global: { headers: { 'x-app-name': 'emerald-casino', 'x-app-version': CASINO_SECURITY_CONFIG.APP_VERSION } }
            }
        );
        if (!casinoDatabase || !casinoDatabase.auth) throw new Error('Supabase client creation returned invalid instance');
        isDatabaseReady = true;
        logSuccess('Supabase client initialized successfully');
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

function generateUniqueCasinoID() {
    try {
        const timestamp = Date.now().toString();
        const timestampComponent = timestamp.slice(-6);
        const randomComponent = Math.floor(Math.random() * 900) + 100;
        let casinoID = timestampComponent + randomComponent.toString();
        if (casinoID.length !== 9) casinoID = Math.floor(100000000 + Math.random() * 900000000).toString();
        if (!/^\d{9}$/.test(casinoID)) casinoID = Math.floor(100000000 + Math.random() * 900000000).toString();
        logSuccess('Casino ID generated: ' + casinoID);
        return casinoID;
    } catch (error) {
        logError('Casino ID generation error: ' + error.message);
        return Math.floor(100000000 + Math.random() * 900000000).toString();
    }
}

async function verifyCasinoIDUnique(casinoID) {
    try {
        if (!isDatabaseReady || !casinoDatabase) return true;
        const { data, error } = await casinoDatabase.from('profiles').select('casino_id').eq('casino_id', casinoID).maybeSingle();
        if (error) return true;
        return data === null;
    } catch (error) { return true; }
}

async function generateGuaranteedUniqueCasinoID() {
    const MAX_RETRIES = 5;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const casinoID = generateUniqueCasinoID();
        const isUnique = await verifyCasinoIDUnique(casinoID);
        if (isUnique) { logSuccess('Unique Casino ID confirmed: ' + casinoID); return casinoID; }
        logWarning('Collision on attempt ' + attempt);
    }
    const fallbackID = Date.now().toString().slice(-9);
    return fallbackID;
}

// ============================================
// SECTION 4: SESSION FIREWALL
// ============================================

async function validateActiveSession() {
    try {
        if (!isDatabaseReady || !casinoDatabase || !casinoDatabase.auth) return false;
        const { data: { session }, error } = await casinoDatabase.auth.getSession();
        if (error || !session) return false;
        if (!session.access_token) return false;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at < currentTimestamp) return false;
        logSuccess('Valid session: ' + session.user.email);
        return true;
    } catch (error) { return false; }
}

async function executeSecurityFirewall() {
    try {
        logInfo('🔒 Security Firewall Checkpoint...');
        const dbInitialized = initializeCasinoDatabase();
        if (!dbInitialized) {
            if (CASINO_SECURITY_CONFIG.AUTO_SHOW_LOGIN) renderLoginOverlay();
            return;
        }
        const hasValidSession = await validateActiveSession();
        if (hasValidSession) {
            logSuccess('🔓 Access Granted');
            await loadAndBindUserProfile();
            initializeRealTimeBalanceTracking();
            initializeAuthStateMonitor();
        } else {
            logWarning('🔒 Access Denied');
            if (CASINO_SECURITY_CONFIG.AUTO_SHOW_LOGIN) renderLoginOverlay();
            initializeAuthStateMonitor();
        }
    } catch (error) {
        logError('Firewall error: ' + error.message);
        if (CASINO_SECURITY_CONFIG.AUTO_SHOW_LOGIN) renderLoginOverlay();
    }
}

// ============================================
// SECTION 5: LOGIN OVERLAY
// ============================================

function renderLoginOverlay() {
    try {
        if (isLoginOverlayVisible) return;
        isLoginOverlayVisible = true;
        const overlayElement = document.createElement('div');
        overlayElement.id = 'casino-auth-firewall';
        overlayElement.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(1,23,19,0.97);backdrop-filter:blur(15px);animation:casinoFadeIn 0.4s ease-in-out;';
        overlayElement.innerHTML = `
            <div style="width:100%;max-width:400px;margin:0 20px;background:linear-gradient(160deg,rgba(2,35,28,0.95),rgba(1,23,19,0.98));border:1px solid rgba(0,230,118,0.15);border-radius:24px;padding:36px 24px;box-shadow:0 30px 60px rgba(0,0,0,0.6);animation:casinoSlideUp 0.5s ease-out;">
                <div style="text-align:center;margin-bottom:28px;">
                    <div style="width:64px;height:64px;background:linear-gradient(135deg,#00e676,#00b0ff);border-radius:18px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:30px;box-shadow:0 12px 28px rgba(0,230,118,0.35);">👑</div>
                    <h2 style="color:#00e676;font-size:26px;font-weight:800;margin:0 0 4px;letter-spacing:3px;">EMERALD</h2>
                    <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:0;">Premium Casino Access</p>
                </div>
                <div style="display:flex;background:rgba(3,56,38,0.4);border-radius:14px;padding:4px;margin-bottom:28px;">
                    <button id="auth-tab-login" style="flex:1;padding:12px;background:#00e676;color:#011713;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;">Sign In</button>
                    <button id="auth-tab-register" style="flex:1;padding:12px;background:transparent;color:rgba(255,255,255,0.5);border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;">Register</button>
                </div>
                <form id="auth-form-login" style="display:block;">
                    <div style="margin-bottom:18px;"><label style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:600;display:block;margin-bottom:6px;">📧 EMAIL</label><input type="email" id="login-email-input" placeholder="player@email.com" style="width:100%;padding:13px 16px;background:rgba(3,56,38,0.25);border:1px solid rgba(0,230,118,0.15);border-radius:13px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;"></div>
                    <div style="margin-bottom:24px;"><label style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:600;display:block;margin-bottom:6px;">🔒 PASSWORD</label><input type="password" id="login-password-input" placeholder="••••••••" style="width:100%;padding:13px 16px;background:rgba(3,56,38,0.25);border:1px solid rgba(0,230,118,0.15);border-radius:13px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;"></div>
                    <button type="submit" style="width:100%;padding:14px;background:linear-gradient(135deg,#00e676,#00b0ff);color:#011713;border:none;border-radius:13px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 10px 28px rgba(0,230,118,0.3);">🔓 Enter Casino</button>
                </form>
                <form id="auth-form-register" style="display:none;">
                    <div style="margin-bottom:16px;"><label style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:600;display:block;margin-bottom:6px;">📧 EMAIL</label><input type="email" id="register-email-input" placeholder="player@email.com" style="width:100%;padding:13px 16px;background:rgba(3,56,38,0.25);border:1px solid rgba(0,230,118,0.15);border-radius:13px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;"></div>
                    <div style="margin-bottom:16px;"><label style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:600;display:block;margin-bottom:6px;">👤 USERNAME</label><input type="text" id="register-username-input" placeholder="Choose a username" style="width:100%;padding:13px 16px;background:rgba(3,56,38,0.25);border:1px solid rgba(0,230,118,0.15);border-radius:13px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;"></div>
                    <div style="margin-bottom:24px;"><label style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:600;display:block;margin-bottom:6px;">🔒 PASSWORD (min 6)</label><input type="password" id="register-password-input" placeholder="••••••••" minlength="6" style="width:100%;padding:13px 16px;background:rgba(3,56,38,0.25);border:1px solid rgba(0,230,118,0.15);border-radius:13px;color:#fff;font-size:14px;outline:none;box-sizing:border-box;"></div>
                    <button type="submit" style="width:100%;padding:14px;background:linear-gradient(135deg,#FFD700,#FFA500);color:#011713;border:none;border-radius:13px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 10px 28px rgba(255,215,0,0.3);">🎰 Create Account</button>
                </form>
                <div id="auth-status-display" style="text-align:center;margin-top:18px;font-size:12px;min-height:22px;"></div>
            </div>`;
        document.body.appendChild(overlayElement);
        initializeOverlayEventListeners();
        logSuccess('🔒 Overlay rendered');
    } catch (error) { logError('Overlay error: ' + error.message); isLoginOverlayVisible = false; }
}

function dismissLoginOverlay() {
    try {
        const overlay = document.getElementById('casino-auth-firewall');
        if (overlay) { overlay.style.animation = 'casinoFadeOut 0.3s ease-in'; setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); isLoginOverlayVisible = false; }, 280); }
    } catch (error) { isLoginOverlayVisible = false; }
}

function showAuthStatusMessage(message, type = 'info') {
    try {
        const el = document.getElementById('auth-status-display');
        if (!el) return;
        const colors = { success: '#00e676', error: '#ff4444', loading: '#FFD700', info: '#ffffff' };
        el.textContent = message; el.style.color = colors[type] || '#ffffff';
    } catch (error) {}
}

function switchToLoginTab() {
    const loginTab = document.getElementById('auth-tab-login');
    const registerTab = document.getElementById('auth-tab-register');
    const loginForm = document.getElementById('auth-form-login');
    const registerForm = document.getElementById('auth-form-register');
    if (loginTab && registerTab) {
        loginTab.style.background = '#00e676'; loginTab.style.color = '#011713';
        registerTab.style.background = 'transparent'; registerTab.style.color = 'rgba(255,255,255,0.5)';
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    }
}

function initializeOverlayEventListeners() {
    try {
        const loginTab = document.getElementById('auth-tab-login');
        const registerTab = document.getElementById('auth-tab-register');
        const loginForm = document.getElementById('auth-form-login');
        const registerForm = document.getElementById('auth-form-register');
        
        if (loginTab) loginTab.addEventListener('click', () => { switchToLoginTab(); showAuthStatusMessage('', 'info'); });
        if (registerTab) registerTab.addEventListener('click', function() {
            this.style.background = '#FFD700'; this.style.color = '#011713';
            loginTab.style.background = 'transparent'; loginTab.style.color = 'rgba(255,255,255,0.5)';
            if (registerForm) registerForm.style.display = 'block';
            if (loginForm) loginForm.style.display = 'none';
            showAuthStatusMessage('', 'info');
        });
        
        if (loginForm) loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email-input')?.value?.trim();
            const password = document.getElementById('login-password-input')?.value;
            if (!email || !password) { showAuthStatusMessage('❌ Please fill all fields', 'error'); return; }
            showAuthStatusMessage('🔄 Authenticating...', 'loading');
            await processLogin(email, password);
        });
        
        if (registerForm) registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('register-email-input')?.value?.trim();
            const username = document.getElementById('register-username-input')?.value?.trim();
            const password = document.getElementById('register-password-input')?.value;
            if (!email || !username || !password) { showAuthStatusMessage('❌ Please fill all fields', 'error'); return; }
            if (password.length < 6) { showAuthStatusMessage('❌ Password must be 6+ chars', 'error'); return; }
            showAuthStatusMessage('🔄 Creating account...', 'loading');
            await processRegistration(email, username, password);
        });
        logSuccess('Event listeners initialized');
    } catch (error) { logError('Listener error: ' + error.message); }
}

// ============================================
// SECTION 6: AUTHENTICATION HANDLERS
// ============================================

async function processLogin(email, password) {
    try {
        if (CASINO_SECURITY_CONFIG.DEMO_MODE_FALLBACK || !isDatabaseReady || !casinoDatabase) {
            showAuthStatusMessage('✅ Login successful! Loading...', 'success');
            setTimeout(() => { loadDemoUserProfile(email); dismissLoginOverlay(); }, 1200);
            return;
        }
        const { data, error } = await casinoDatabase.auth.signInWithPassword({ email, password });
        if (error) {
            showAuthStatusMessage('❌ ' + (error.message.includes('Invalid') ? 'Invalid email or password' : error.message), 'error');
            return;
        }
        showAuthStatusMessage('✅ Login successful!', 'success');
        await loadAndBindUserProfile();
        initializeRealTimeBalanceTracking();
        setTimeout(() => dismissLoginOverlay(), 800);
    } catch (error) { showAuthStatusMessage('❌ Login failed', 'error'); }
}

async function processRegistration(email, username, password) {
    try {
        const casinoID = await generateGuaranteedUniqueCasinoID();
        
        // ✅ FIX: Demo Mode - Switch to login tab, do NOT dismiss overlay
        if (CASINO_SECURITY_CONFIG.DEMO_MODE_FALLBACK || !isDatabaseReady || !casinoDatabase) {
            showAuthStatusMessage('✅ Account created! ID: ' + casinoID, 'success');
            setTimeout(() => {
                switchToLoginTab();
                showAuthStatusMessage('✅ Please sign in with your credentials', 'success');
            }, 2000);
            return;
        }
        
        const { data, error } = await casinoDatabase.auth.signUp({
            email, password,
            options: { data: { username, casino_id: casinoID } }
        });
        
        if (error) {
            showAuthStatusMessage('❌ ' + error.message, 'error');
            return;
        }
        
        // ✅ FIX: After signup, switch to login tab
        showAuthStatusMessage('✅ Account created! Please sign in.', 'success');
        setTimeout(() => {
            switchToLoginTab();
            showAuthStatusMessage('✅ Enter your credentials to sign in', 'success');
        }, 2000);
        
    } catch (error) { showAuthStatusMessage('❌ Registration failed', 'error'); }
}

async function processLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    if (isDatabaseReady && casinoDatabase) { cleanupRealtimeTracking(); await casinoDatabase.auth.signOut(); }
    resetProfileToGuestState();
    updateBalanceDisplay(0, 0);
    setTimeout(() => renderLoginOverlay(), 300);
}

// ============================================
// SECTIONS 7-14: (Same as original - Profile Binder, VIP, Real-time, etc.)
// ... [REST OF THE ORIGINAL CODE FROM SECTION 7 TO 14 REMAINS EXACTLY THE SAME] ...
// ============================================

// Note: Sections 7 through 14 from your original code remain unchanged.
// Only the processRegistration function and switchToLoginTab helper were modified.
