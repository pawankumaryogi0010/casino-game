// ============================================
// EMERALD KING CASINO - ADMIN CONTROL PANEL
// Secure Administrative Dashboard
// File: js/admin.js
// Version: 1.0.0 Production
// ============================================

// ============================================
// SECTION 1: CONFIGURATION & CONSTANTS
// ============================================

const ADMIN_CONFIG = {
    // Hash route that triggers admin panel
    ADMIN_HASH: '#secret-admin-panel',
    
    // Required role for access
    REQUIRED_ROLE: 'admin',
    
    // Polling interval for pending deposits (ms)
    POLLING_INTERVAL: 10000,
    
    // Maximum deposits to show per page
    DEPOSITS_PER_PAGE: 20,
    
    // Enable auto-refresh
    AUTO_REFRESH: true
};

// ============================================
// SECTION 2: ADMIN AUTHENTICATION & SECURITY
// ============================================

/**
 * Verify that the current user has admin privileges
 * Checks Supabase auth user metadata for 'admin' role
 * @returns {Promise<boolean>} True if user is admin
 */
async function verifyAdminAccess() {
    try {
        // Check if Supabase is initialized
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            console.error('🔴 ADMIN: Database not initialized');
            return false;
        }
        
        // Get current session
        const client = window.emeraldDB.getClient();
        if (!client || !client.auth) {
            console.error('🔴 ADMIN: No auth client');
            return false;
        }
        
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
        if (sessionError || !session) {
            console.warn('🔴 ADMIN: No active session');
            return false;
        }
        
        // Check user metadata for admin role
        const userRole = session.user?.user_metadata?.role || 
                        session.user?.app_metadata?.role || 
                        'user';
        
        console.log('🔍 ADMIN: User role detected:', userRole);
        
        if (userRole !== ADMIN_CONFIG.REQUIRED_ROLE) {
            console.warn('🔴 ADMIN: Access denied - User role is:', userRole);
            return false;
        }
        
        console.log('✅ ADMIN: Access granted for', session.user.email);
        return true;
        
    } catch (error) {
        console.error('🔴 ADMIN: Verification error:', error);
        return false;
    }
}

/**
 * Security checkpoint - runs on hash change
 * If accessing admin panel without privileges, redirect to home
 */
async function adminSecurityCheckpoint() {
    try {
        const currentHash = window.location.hash;
        
        // Only check when on admin hash
        if (currentHash !== ADMIN_CONFIG.ADMIN_HASH) {
            return;
        }
        
        console.log('🔒 ADMIN: Security checkpoint triggered');
        
        // Verify admin access
        const isAdmin = await verifyAdminAccess();
        
        if (!isAdmin) {
            console.warn('🔴 ADMIN: Unauthorized access attempt - Redirecting to home');
            
            // Show unauthorized toast
            if (typeof showToast === 'function') {
                showToast('⛔ Access Denied: Admin privileges required');
            }
            
            // Redirect to home
            window.location.hash = '#home-view';
            
            // Also hide admin view if it was somehow shown
            const adminView = document.getElementById('admin-panel-view');
            if (adminView) {
                adminView.classList.add('hidden');
            }
            
            return false;
        }
        
        // Access granted - show admin panel
        console.log('✅ ADMIN: Access granted - Loading panel');
        renderAdminPanel();
        loadPendingDeposits();
        
        // Start auto-refresh
        if (ADMIN_CONFIG.AUTO_REFRESH) {
            startAutoRefresh();
        }
        
        return true;
        
    } catch (error) {
        console.error('🔴 ADMIN: Security checkpoint error:', error);
        window.location.hash = '#home-view';
        return false;
    }
}

// ============================================
// SECTION 3: ADMIN PANEL RENDERING
// ============================================

/**
 * Render the complete admin panel into the DOM
 * Creates a new hash view for the admin interface
 */
function renderAdminPanel() {
    try {
        // Check if panel already exists
        let adminView = document.getElementById('admin-panel-view');
        
        // Get main content area
        const mainContent = document.querySelector('main');
        if (!mainContent) {
            console.error('🔴 ADMIN: Main content area not found');
            return;
        }
        
        // Remove existing admin view if present
        if (adminView) {
            adminView.remove();
        }
        
        // Create admin view container
        adminView = document.createElement('div');
        adminView.id = 'admin-panel-view';
        adminView.className = 'hash-view hidden';
        adminView.style.cssText = 'padding:0;';
        
        // Build admin panel HTML
        adminView.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:12px;">
                
                <!-- Admin Header -->
                <div style="
                    background:rgba(255,68,68,0.1);
                    border:1px solid rgba(255,68,68,0.3);
                    border-radius:12px;
                    padding:14px 16px;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                ">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span style="font-size:22px;">🛡️</span>
                        <div>
                            <h3 style="color:#ff4444;font-size:14px;font-weight:bold;margin:0;">ADMIN PANEL</h3>
                            <p style="color:rgba(255,255,255,0.5);font-size:10px;margin:0;">Deposit Management</p>
                        </div>
                    </div>
                    <button id="admin-refresh-btn" style="
                        background:rgba(255,255,255,0.08);
                        border:1px solid rgba(255,255,255,0.2);
                        color:white;
                        padding:6px 12px;
                        border-radius:16px;
                        font-size:10px;
                        cursor:pointer;
                    " onclick="refreshAdminDeposits()">
                        🔄 Refresh
                    </button>
                </div>
                
                <!-- Stats Bar -->
                <div style="
                    display:grid;
                    grid-template-columns:1fr 1fr 1fr;
                    gap:8px;
                ">
                    <div style="
                        background:rgba(255,215,0,0.08);
                        border:1px solid rgba(255,215,0,0.2);
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">PENDING</span>
                        <p id="admin-pending-count" style="color:#FFD700;font-size:18px;font-weight:bold;margin:4px 0 0;">0</p>
                    </div>
                    <div style="
                        background:rgba(0,230,118,0.08);
                        border:1px solid rgba(0,230,118,0.2);
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">APPROVED</span>
                        <p id="admin-approved-today" style="color:#00e676;font-size:18px;font-weight:bold;margin:4px 0 0;">0</p>
                    </div>
                    <div style="
                        background:rgba(255,68,68,0.08);
                        border:1px solid rgba(255,68,68,0.2);
                        border-radius:10px;
                        padding:10px;
                        text-align:center;
                    ">
                        <span style="color:rgba(255,255,255,0.5);font-size:9px;">REJECTED</span>
                        <p id="admin-rejected-today" style="color:#ff4444;font-size:18px;font-weight:bold;margin:4px 0 0;">0</p>
                    </div>
                </div>
                
                <!-- Deposits List Header -->
                <div style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:0 4px;
                ">
                    <span style="color:rgba(255,255,255,0.7);font-size:12px;font-weight:bold;">
                        📋 Pending Deposits
                    </span>
                    <span id="admin-total-amount" style="color:#FFD700;font-size:10px;font-weight:bold;">
                        Total: ₹0
                    </span>
                </div>
                
                <!-- Deposits List Container -->
                <div id="admin-deposits-list" style="
                    display:flex;
                    flex-direction:column;
                    gap:8px;
                    max-height:55vh;
                    overflow-y:auto;
                    padding-right:2px;
                ">
                    <!-- Loading State -->
                    <div id="admin-loading" style="
                        text-align:center;
                        padding:30px;
                        color:rgba(255,255,255,0.4);
                    ">
                        <i class="fas fa-spinner fa-spin"></i> Loading deposits...
                    </div>
                    
                    <!-- Empty State -->
                    <div id="admin-empty" style="
                        display:none;
                        text-align:center;
                        padding:30px;
                        color:rgba(255,255,255,0.4);
                    ">
                        <span style="font-size:28px;display:block;margin-bottom:8px;">✅</span>
                        No pending deposits
                    </div>
                </div>
                
                <!-- Admin Logout -->
                <button id="admin-exit-btn" style="
                    width:100%;
                    background:rgba(255,68,68,0.1);
                    border:1px solid rgba(255,68,68,0.3);
                    color:#ff4444;
                    padding:12px;
                    border-radius:12px;
                    font-size:12px;
                    font-weight:bold;
                    cursor:pointer;
                " onclick="exitAdminPanel()">
                    🚪 Exit Admin Panel
                </button>
                
            </div>
        `;
        
        // Add to main content
        mainContent.appendChild(adminView);
        
        // Hide all other views
        document.querySelectorAll('.hash-view').forEach(v => v.classList.add('hidden'));
        
        // Show admin view
        adminView.classList.remove('hidden');
        adminView.classList.add('animate-fade-in');
        
        // Hide bottom nav
        const bottomNav = document.querySelector('nav');
        if (bottomNav) bottomNav.style.display = 'none';
        
        // Hide top bar
        const topBar = document.querySelector('header');
        if (topBar) topBar.style.display = 'none';
        
        console.log('✅ ADMIN: Panel rendered');
        
    } catch (error) {
        console.error('🔴 ADMIN: Render error:', error);
    }
}

// ============================================
// SECTION 4: DEPOSIT DATA FETCHING
// ============================================

/**
 * Fetch all pending deposits from Supabase
 * @returns {Promise<Array>} Array of pending deposit records
 */
async function fetchPendingDeposits() {
    try {
        const client = window.emeraldDB.getClient();
        if (!client) {
            console.error('🔴 ADMIN: No database client');
            return [];
        }
        
        // Query deposits_ledger for pending status
        const { data, error } = await client
            .from('deposits_ledger')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(ADMIN_CONFIG.DEPOSITS_PER_PAGE);
        
        if (error) {
            console.error('🔴 ADMIN: Fetch deposits error:', error);
            return [];
        }
        
        console.log('📊 ADMIN: Fetched', data?.length || 0, 'pending deposits');
        return data || [];
        
    } catch (error) {
        console.error('🔴 ADMIN: Fetch deposits exception:', error);
        return [];
    }
}

/**
 * Fetch deposit statistics for admin dashboard
 * @returns {Promise<Object>} Statistics object
 */
async function fetchAdminStats() {
    try {
        const client = window.emeraldDB.getClient();
        if (!client) return { pending: 0, approvedToday: 0, rejectedToday: 0, totalAmount: 0 };
        
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        // Fetch all relevant deposits
        const { data, error } = await client
            .from('deposits_ledger')
            .select('status, amount, created_at')
            .gte('created_at', todayISO)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('🔴 ADMIN: Stats error:', error);
            return { pending: 0, approvedToday: 0, rejectedToday: 0, totalAmount: 0 };
        }
        
        const stats = {
            pending: 0,
            approvedToday: 0,
            rejectedToday: 0,
            totalAmount: 0
        };
        
        (data || []).forEach(deposit => {
            if (deposit.status === 'pending') {
                stats.pending++;
                stats.totalAmount += parseFloat(deposit.amount || 0);
            } else if (deposit.status === 'success') {
                stats.approvedToday++;
            } else if (deposit.status === 'failed') {
                stats.rejectedToday++;
            }
        });
        
        return stats;
        
    } catch (error) {
        console.error('🔴 ADMIN: Stats exception:', error);
        return { pending: 0, approvedToday: 0, rejectedToday: 0, totalAmount: 0 };
    }
}

// ============================================
// SECTION 5: DEPOSIT RENDERING
// ============================================

/**
 * Load and render pending deposits with stats
 */
async function loadPendingDeposits() {
    try {
        // Show loading
        const loadingEl = document.getElementById('admin-loading');
        const emptyEl = document.getElementById('admin-empty');
        const depositsList = document.getElementById('admin-deposits-list');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        
        // Clear existing deposit cards (except loading/empty)
        if (depositsList) {
            const cards = depositsList.querySelectorAll('.admin-deposit-card');
            cards.forEach(card => card.remove());
        }
        
        // Fetch data
        const [deposits, stats] = await Promise.all([
            fetchPendingDeposits(),
            fetchAdminStats()
        ]);
        
        // Update stats
        updateAdminStats(stats);
        
        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Show empty state or deposits
        if (!deposits || deposits.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        
        if (emptyEl) emptyEl.style.display = 'none';
        
        // Render each deposit
        deposits.forEach(deposit => {
            renderDepositCard(deposit);
        });
        
        // Update total amount
        const totalAmountEl = document.getElementById('admin-total-amount');
        if (totalAmountEl) {
            const total = deposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);
            totalAmountEl.textContent = 'Total: ₹' + total.toLocaleString('en-IN');
        }
        
    } catch (error) {
        console.error('🔴 ADMIN: Load deposits error:', error);
        
        const loadingEl = document.getElementById('admin-loading');
        if (loadingEl) {
            loadingEl.innerHTML = '<span style="color:#ff4444;">❌ Failed to load deposits</span>';
        }
    }
}

/**
 * Render a single deposit card in the admin list
 * @param {Object} deposit - Deposit record from database
 */
function renderDepositCard(deposit) {
    try {
        const depositsList = document.getElementById('admin-deposits-list');
        if (!depositsList) return;
        
        // Create card
        const card = document.createElement('div');
        card.className = 'admin-deposit-card';
        card.id = 'deposit-card-' + deposit.id;
        card.style.cssText = `
            background:rgba(255,255,255,0.04);
            border:1px solid rgba(255,255,255,0.1);
            border-radius:12px;
            padding:14px;
            transition:all 0.3s ease;
        `;
        
        // Format data
        const amount = parseFloat(deposit.amount || 0).toLocaleString('en-IN');
        const gatewayName = getGatewayDisplay(deposit.gateway);
        const gatewayColor = getGatewayColor(deposit.gateway);
        const createdAt = formatAdminDate(deposit.created_at);
        const shortTxid = shortenString(deposit.txid, 20);
        const userId = shortenString(deposit.user_id, 12);
        
        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <div>
                    <span style="color:${gatewayColor};font-size:11px;font-weight:bold;">${gatewayName}</span>
                    <span style="color:rgba(255,255,255,0.4);font-size:9px;margin-left:6px;">${createdAt}</span>
                </div>
                <span style="color:#FFD700;font-size:14px;font-weight:bold;">₹${amount}</span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
                <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:8px;">
                    <span style="color:rgba(255,255,255,0.4);font-size:8px;display:block;">User ID</span>
                    <span style="color:rgba(255,255,255,0.7);font-size:9px;font-family:monospace;">${userId}</span>
                </div>
                <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:8px;">
                    <span style="color:rgba(255,255,255,0.4);font-size:8px;display:block;">Txr-ID</span>
                    <span style="color:rgba(255,255,255,0.7);font-size:9px;font-family:monospace;" title="${deposit.txid || ''}">${shortTxid}</span>
                </div>
            </div>
            
            <div style="display:flex;gap:8px;">
                <button class="admin-approve-btn" data-deposit-id="${deposit.id}" data-user-id="${deposit.user_id}" data-amount="${deposit.amount}" style="
                    flex:1;
                    background:rgba(0,230,118,0.15);
                    border:1px solid rgba(0,230,118,0.4);
                    color:#00e676;
                    padding:10px;
                    border-radius:10px;
                    font-size:11px;
                    font-weight:bold;
                    cursor:pointer;
                    transition:all 0.3s;
                " onmouseover="this.style.background='rgba(0,230,118,0.3)'" onmouseout="this.style.background='rgba(0,230,118,0.15)'">
                    ✅ Approve
                </button>
                <button class="admin-reject-btn" data-deposit-id="${deposit.id}" style="
                    flex:1;
                    background:rgba(255,68,68,0.1);
                    border:1px solid rgba(255,68,68,0.3);
                    color:#ff4444;
                    padding:10px;
                    border-radius:10px;
                    font-size:11px;
                    font-weight:bold;
                    cursor:pointer;
                    transition:all 0.3s;
                " onmouseover="this.style.background='rgba(255,68,68,0.25)'" onmouseout="this.style.background='rgba(255,68,68,0.1)'">
                    ❌ Reject
                </button>
            </div>
        `;
        
        // Add event listeners
        const approveBtn = card.querySelector('.admin-approve-btn');
        const rejectBtn = card.querySelector('.admin-reject-btn');
        
        if (approveBtn) {
            approveBtn.addEventListener('click', function() {
                const depositId = this.getAttribute('data-deposit-id');
                const userId = this.getAttribute('data-user-id');
                const amount = parseFloat(this.getAttribute('data-amount'));
                handleApproveDeposit(depositId, userId, amount);
            });
        }
        
        if (rejectBtn) {
            rejectBtn.addEventListener('click', function() {
                const depositId = this.getAttribute('data-deposit-id');
                handleRejectDeposit(depositId);
            });
        }
        
        // Add to list
        depositsList.appendChild(card);
        
    } catch (error) {
        console.error('🔴 ADMIN: Render card error:', error);
    }
}

/**
 * Update admin statistics display
 * @param {Object} stats - Statistics object
 */
function updateAdminStats(stats) {
    try {
        const pendingEl = document.getElementById('admin-pending-count');
        const approvedEl = document.getElementById('admin-approved-today');
        const rejectedEl = document.getElementById('admin-rejected-today');
        
        if (pendingEl) pendingEl.textContent = stats.pending || 0;
        if (approvedEl) approvedEl.textContent = stats.approvedToday || 0;
        if (rejectedEl) rejectedEl.textContent = stats.rejectedToday || 0;
        
    } catch (error) {
        console.error('🔴 ADMIN: Stats update error:', error);
    }
}

// ============================================
// SECTION 6: APPROVE / REJECT HANDLERS
// ============================================

/**
 * Handle deposit approval
 * Atomic transaction: Update deposit status + increment user balance
 * @param {string} depositId - Deposit record ID
 * @param {string} userId - Target user ID
 * @param {number} amount - Deposit amount
 */
async function handleApproveDeposit(depositId, userId, amount) {
    try {
        // Confirm with admin
        if (!confirm(`Approve deposit?\n\nAmount: ₹${amount.toLocaleString('en-IN')}\nUser: ${userId}\n\nThis will credit the user's balance.`)) {
            return;
        }
        
        // Disable buttons
        disableDepositButtons(depositId);
        showDepositStatus(depositId, '⏳ Processing...', '#FFD700');
        
        const client = window.emeraldDB.getClient();
        if (!client) {
            throw new Error('Database client not available');
        }
        
        // Step 1: Update deposit status to 'success'
        const { error: depositError } = await client
            .from('deposits_ledger')
            .update({ 
                status: 'success',
                updated_at: new Date().toISOString()
            })
            .eq('id', depositId);
        
        if (depositError) {
            throw new Error('Failed to update deposit: ' + depositError.message);
        }
        
        console.log('✅ ADMIN: Deposit marked as success:', depositId);
        
        // Step 2: Increment user's balance
        // First, get current balance
        const { data: profile, error: profileFetchError } = await client
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();
        
        if (profileFetchError) {
            throw new Error('Failed to fetch user profile: ' + profileFetchError.message);
        }
        
        const currentBalance = parseFloat(profile?.balance || 0);
        const newBalance = currentBalance + amount;
        
        // Update balance
        const { error: balanceError } = await client
            .from('profiles')
            .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        
        if (balanceError) {
            // Rollback deposit status
            console.error('🔴 ADMIN: Balance update failed, rolling back...');
            await client
                .from('deposits_ledger')
                .update({ status: 'pending' })
                .eq('id', depositId);
            
            throw new Error('Failed to update balance: ' + balanceError.message);
        }
        
        console.log('✅ ADMIN: Balance updated for user', userId, ':', currentBalance, '→', newBalance);
        
        // Show success
        showDepositStatus(depositId, '✅ Approved!', '#00e676');
        
        // Show toast
        if (typeof window.emeraldDB?.showToast === 'function') {
            window.emeraldDB.showToast('✅ Deposit approved! User credited ₹' + amount.toLocaleString('en-IN'));
        }
        
        // Remove card after delay
        setTimeout(() => {
            removeDepositCard(depositId);
            refreshAdminDeposits();
        }, 1500);
        
    } catch (error) {
        console.error('🔴 ADMIN: Approve error:', error);
        showDepositStatus(depositId, '❌ Error: ' + error.message, '#ff4444');
        enableDepositButtons(depositId);
        
        alert('Failed to approve deposit: ' + error.message);
    }
}

/**
 * Handle deposit rejection
 * Only updates status, does NOT modify balance
 * @param {string} depositId - Deposit record ID
 */
async function handleRejectDeposit(depositId) {
    try {
        // Confirm with admin
        if (!confirm('Reject this deposit?\n\nThe user will NOT be credited. This action cannot be undone.')) {
            return;
        }
        
        // Disable buttons
        disableDepositButtons(depositId);
        showDepositStatus(depositId, '⏳ Rejecting...', '#FFD700');
        
        const client = window.emeraldDB.getClient();
        if (!client) {
            throw new Error('Database client not available');
        }
        
        // Update deposit status to 'failed' (NO balance change)
        const { error } = await client
            .from('deposits_ledger')
            .update({ 
                status: 'failed',
                updated_at: new Date().toISOString()
            })
            .eq('id', depositId);
        
        if (error) {
            throw new Error('Failed to reject deposit: ' + error.message);
        }
        
        console.log('✅ ADMIN: Deposit rejected:', depositId);
        
        // Show status
        showDepositStatus(depositId, '❌ Rejected', '#ff4444');
        
        // Show toast
        if (typeof window.emeraldDB?.showToast === 'function') {
            window.emeraldDB.showToast('❌ Deposit rejected');
        }
        
        // Remove card after delay
        setTimeout(() => {
            removeDepositCard(depositId);
            refreshAdminDeposits();
        }, 1500);
        
    } catch (error) {
        console.error('🔴 ADMIN: Reject error:', error);
        showDepositStatus(depositId, '❌ Error: ' + error.message, '#ff4444');
        enableDepositButtons(depositId);
        
        alert('Failed to reject deposit: ' + error.message);
    }
}

// ============================================
// SECTION 7: UI HELPERS
// ============================================

/**
 * Disable approve/reject buttons for a deposit card
 * @param {string} depositId - Deposit record ID
 */
function disableDepositButtons(depositId) {
    try {
        const card = document.getElementById('deposit-card-' + depositId);
        if (!card) return;
        
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    } catch (error) {
        console.error('🔴 ADMIN: Disable buttons error:', error);
    }
}

/**
 * Enable approve/reject buttons for a deposit card
 * @param {string} depositId - Deposit record ID
 */
function enableDepositButtons(depositId) {
    try {
        const card = document.getElementById('deposit-card-' + depositId);
        if (!card) return;
        
        const buttons = card.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    } catch (error) {
        console.error('🔴 ADMIN: Enable buttons error:', error);
    }
}

/**
 * Show status message on a deposit card
 * @param {string} depositId - Deposit record ID
 * @param {string} message - Status message
 * @param {string} color - Text color
 */
function showDepositStatus(depositId, message, color) {
    try {
        const card = document.getElementById('deposit-card-' + depositId);
        if (!card) return;
        
        // Remove existing status if any
        const existingStatus = card.querySelector('.admin-deposit-status');
        if (existingStatus) existingStatus.remove();
        
        // Create status element
        const status = document.createElement('div');
        status.className = 'admin-deposit-status';
        status.style.cssText = `
            text-align:center;
            padding:8px;
            margin-top:8px;
            color:${color};
            font-size:11px;
            font-weight:bold;
            border-top:1px solid rgba(255,255,255,0.1);
        `;
        status.textContent = message;
        
        card.appendChild(status);
    } catch (error) {
        console.error('🔴 ADMIN: Status display error:', error);
    }
}

/**
 * Remove a deposit card from the list
 * @param {string} depositId - Deposit record ID
 */
function removeDepositCard(depositId) {
    try {
        const card = document.getElementById('deposit-card-' + depositId);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            card.style.transition = 'all 0.3s ease';
            setTimeout(() => card.remove(), 300);
        }
    } catch (error) {
        console.error('🔴 ADMIN: Remove card error:', error);
    }
}

// ============================================
// SECTION 8: AUTO-REFRESH
// ============================================

let adminRefreshInterval = null;

/**
 * Start auto-refresh polling
 */
function startAutoRefresh() {
    stopAutoRefresh();
    
    adminRefreshInterval = setInterval(() => {
        console.log('🔄 ADMIN: Auto-refreshing...');
        loadPendingDeposits();
    }, ADMIN_CONFIG.POLLING_INTERVAL);
    
    console.log('🔄 ADMIN: Auto-refresh started (every ' + ADMIN_CONFIG.POLLING_INTERVAL / 1000 + 's)');
}

/**
 * Stop auto-refresh polling
 */
function stopAutoRefresh() {
    if (adminRefreshInterval) {
        clearInterval(adminRefreshInterval);
        adminRefreshInterval = null;
        console.log('⏹️ ADMIN: Auto-refresh stopped');
    }
}

/**
 * Manual refresh (called from refresh button)
 */
async function refreshAdminDeposits() {
    console.log('🔄 ADMIN: Manual refresh triggered');
    await loadPendingDeposits();
    
    // Show brief feedback
    const refreshBtn = document.getElementById('admin-refresh-btn');
    if (refreshBtn) {
        const originalText = refreshBtn.textContent;
        refreshBtn.textContent = '✅ Refreshed';
        setTimeout(() => { refreshBtn.textContent = originalText; }, 1000);
    }
}

// ============================================
// SECTION 9: EXIT ADMIN PANEL
// ============================================

/**
 * Exit admin panel and return to home
 */
function exitAdminPanel() {
    try {
        console.log('🚪 ADMIN: Exiting panel');
        
        // Stop auto-refresh
        stopAutoRefresh();
        
        // Remove admin view
        const adminView = document.getElementById('admin-panel-view');
        if (adminView) {
            adminView.remove();
        }
        
        // Show top bar
        const topBar = document.querySelector('header');
        if (topBar) topBar.style.display = 'flex';
        
        // Show bottom nav
        const bottomNav = document.querySelector('nav');
        if (bottomNav) bottomNav.style.display = '';
        
        // Redirect to home
        window.location.hash = '#home-view';
        
        // Restore home view
        setTimeout(() => {
            const homeView = document.getElementById('home-view');
            if (homeView) {
                document.querySelectorAll('.hash-view').forEach(v => v.classList.add('hidden'));
                homeView.classList.remove('hidden');
            }
        }, 100);
        
    } catch (error) {
        console.error('🔴 ADMIN: Exit error:', error);
        window.location.hash = '#home-view';
    }
}

// ============================================
// SECTION 10: UTILITY FUNCTIONS
// ============================================

/**
 * Get display name for payment gateway
 * @param {string} gateway - Gateway identifier
 * @returns {string} Display name
 */
function getGatewayDisplay(gateway) {
    const gateways = {
        'bkash': '📱 bKash',
        'nagad': '💳 Nagad',
        'usdt': '₿ USDT',
        'upi': '📲 UPI',
        'bank': '🏦 Bank Transfer'
    };
    return gateways[gateway] || gateway || 'Unknown';
}

/**
 * Get color for payment gateway
 * @param {string} gateway - Gateway identifier
 * @returns {string} CSS color
 */
function getGatewayColor(gateway) {
    const colors = {
        'bkash': '#00e676',
        'nagad': '#FFD700',
        'usdt': '#00b0ff',
        'upi': '#c084fc',
        'bank': '#ff8800'
    };
    return colors[gateway] || '#ffffff';
}

/**
 * Format date for admin display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date/time
 */
function formatAdminDate(dateString) {
    try {
        if (!dateString) return '--';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '--';
    }
}

/**
 * Shorten a string for display
 * @param {string} str - String to shorten
 * @param {number} maxLen - Maximum length
 * @returns {string} Shortened string
 */
function shortenString(str, maxLen = 12) {
    if (!str) return '---';
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen - 3) + '...';
}

// ============================================
// SECTION 11: HASH ROUTE LISTENER
// ============================================

/**
 * Listen for hash changes to detect admin panel access
 */
function setupAdminHashListener() {
    // Listen for hash changes
    window.addEventListener('hashchange', async () => {
        const hash = window.location.hash;
        
        if (hash === ADMIN_CONFIG.ADMIN_HASH) {
            console.log('🔍 ADMIN: Hash detected, running security check...');
            await adminSecurityCheckpoint();
        } else {
            // If leaving admin panel, clean up
            stopAutoRefresh();
            
            // Show nav and header if hidden
            const bottomNav = document.querySelector('nav');
            const topBar = document.querySelector('header');
            if (bottomNav) bottomNav.style.display = '';
            if (topBar) topBar.style.display = 'flex';
        }
    });
    
    // Check on initial load
    window.addEventListener('DOMContentLoaded', async () => {
        if (window.location.hash === ADMIN_CONFIG.ADMIN_HASH) {
            setTimeout(async () => {
                await adminSecurityCheckpoint();
            }, 1000);
        }
    });
    
    console.log('👂 ADMIN: Hash listener active');
}

// ============================================
// SECTION 12: KEYBOARD SHORTCUT
// ============================================

/**
 * Secret keyboard shortcut to access admin panel
 * Press Ctrl+Shift+A to navigate to admin panel
 */
function setupAdminShortcut() {
    document.addEventListener('keydown', (event) => {
        // Ctrl+Shift+A
        if (event.ctrlKey && event.shiftKey && event.key === 'A') {
            event.preventDefault();
            console.log('⌨️ ADMIN: Shortcut activated');
            window.location.hash = ADMIN_CONFIG.ADMIN_HASH;
        }
        
        // Escape to exit admin
        if (event.key === 'Escape') {
            const adminView = document.getElementById('admin-panel-view');
            if (adminView && !adminView.classList.contains('hidden')) {
                exitAdminPanel();
            }
        }
    });
    
    console.log('⌨️ ADMIN: Keyboard shortcuts active (Ctrl+Shift+A to access)');
}

// ============================================
// SECTION 13: GLOBAL EXPORT
// ============================================

window.emeraldAdmin = {
    // Core functions
    verifyAccess: verifyAdminAccess,
    renderPanel: renderAdminPanel,
    loadDeposits: loadPendingDeposits,
    
    // Actions
    approveDeposit: handleApproveDeposit,
    rejectDeposit: handleRejectDeposit,
    
    // UI
    refreshDeposits: refreshAdminDeposits,
    exitPanel: exitAdminPanel,
    
    // Config
    config: ADMIN_CONFIG
};

// Make refresh available globally for onclick
window.refreshAdminDeposits = refreshAdminDeposits;
window.exitAdminPanel = exitAdminPanel;

// ============================================
// SECTION 14: AUTO-INITIALIZE
// ============================================

function initializeAdminModule() {
    try {
        console.log('🛡️ Initializing Admin Control Panel...');
        
        // Setup hash listener
        setupAdminHashListener();
        
        // Setup keyboard shortcut
        setupAdminShortcut();
        
        console.log('✅ Admin Control Panel Ready');
        console.log('🔑 Access via: #secret-admin-panel');
        console.log('⌨️ Shortcut: Ctrl+Shift+A');
        console.log('📋 Available: window.emeraldAdmin');
        
    } catch (error) {
        console.error('🔴 ADMIN: Initialization error:', error);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminModule);
} else {
    initializeAdminModule();
}

console.log('🛡️ Admin Control Panel Module v1.0.0 Loaded');
