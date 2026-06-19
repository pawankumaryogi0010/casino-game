// ============================================
// EMERALD KING CASINO - AGENT CENTER DASHBOARD
// Referral Tracking & Subordinate Statistics
// NO Financial Transactions - Demo Only
// File: js/agent.js
// Version: 1.0.0
// ============================================

// ============================================
// SECTION 1: CONFIGURATION
// ============================================

const AGENT_CONFIG = {
    // Production domain for referral links
    PRODUCTION_DOMAIN: 'emerald.com',
    
    // Default referral code prefix
    REFERRAL_PREFIX: 'ref',
    
    // Enable console logging
    ENABLE_LOGGING: true,
    
    // Auto-refresh interval (ms)
    REFRESH_INTERVAL: 30000
};

// ============================================
// SECTION 2: REFERRAL LINK GENERATOR
// ============================================

/**
 * Fetch the active user's referral data from profiles table
 * Gets referral_code and builds the full referral link
 * @returns {Promise<Object>} Referral data { link, code, userId }
 */
async function generateReferralLink() {
    try {
        // Check database availability
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            console.warn('⚠️ AGENT: Database not available, using demo mode');
            return getDemoReferralData();
        }
        
        // Fetch user profile
        const profile = await window.emeraldDB.fetchProfile();
        
        if (!profile) {
            console.warn('⚠️ AGENT: No profile found, using demo mode');
            return getDemoReferralData();
        }
        
        // Build referral link
        const referralCode = profile.referral_code || profile.casino_id || 'DEMO';
        const referralLink = `https://${AGENT_CONFIG.PRODUCTION_DOMAIN}/${AGENT_CONFIG.REFERRAL_PREFIX}/${referralCode}`;
        
        const referralData = {
            link: referralLink,
            code: referralCode,
            userId: profile.casino_id || '---',
            username: profile.username || 'Player'
        };
        
        console.log('✅ AGENT: Referral link generated:', referralLink);
        return referralData;
        
    } catch (error) {
        console.error('❌ AGENT: Referral link error:', error);
        return getDemoReferralData();
    }
}

/**
 * Generate demo referral data when database is not available
 * @returns {Object} Demo referral data
 */
function getDemoReferralData() {
    const demoCode = 'DEMO' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const demoData = {
        link: `https://${AGENT_CONFIG.PRODUCTION_DOMAIN}/${AGENT_CONFIG.REFERRAL_PREFIX}/${demoCode}`,
        code: demoCode,
        userId: 'DEMO' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        username: 'Demo_Player'
    };
    
    console.log('📝 AGENT: Using demo referral data');
    return demoData;
}

/**
 * Copy referral link to clipboard
 * @param {string} link - The referral link to copy
 */
async function copyReferralLink(link) {
    try {
        if (!link) {
            const data = await generateReferralLink();
            link = data.link;
        }
        
        // Try modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(link);
            showAgentToast('✅ Referral link copied!');
            console.log('✅ AGENT: Link copied to clipboard');
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = link;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showAgentToast('✅ Referral link copied!');
        }
        
    } catch (error) {
        console.error('❌ AGENT: Copy error:', error);
        showAgentToast('❌ Failed to copy link');
    }
}

// ============================================
// SECTION 3: SUBORDINATE STATISTICS
// ============================================

/**
 * Count unique users registered under this agent's referral code
 * Queries profiles table for matching referral_code
 * @returns {Promise<Object>} Subordinate statistics
 */
async function fetchSubordinateStats() {
    try {
        // Check database availability
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            console.warn('⚠️ AGENT: Database not available for stats');
            return getDemoSubordinateStats();
        }
        
        const client = window.emeraldDB.getClient();
        if (!client) {
            return getDemoSubordinateStats();
        }
        
        // Get current user's referral code
        const profile = await window.emeraldDB.fetchProfile();
        if (!profile || !profile.referral_code) {
            return getDemoSubordinateStats();
        }
        
        // Count users registered with this referral code
        const { count, error } = await client
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .neq('referral_code', profile.referral_code) // Exclude self
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ AGENT: Subordinate count error:', error);
            return getDemoSubordinateStats();
        }
        
        // Fetch recent subordinates (last 10)
        const { data: recentUsers, error: recentError } = await client
            .from('profiles')
            .select('username, casino_id, created_at, vip_level')
            .neq('referral_code', profile.referral_code)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (recentError) {
            console.error('❌ AGENT: Recent users error:', recentError);
        }
        
        // Calculate stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        const todayCount = (recentUsers || []).filter(u => 
            u.created_at && new Date(u.created_at) >= today
        ).length;
        
        const stats = {
            totalSubordinates: count || 0,
            todaySubordinates: todayCount,
            recentSubordinates: (recentUsers || []).slice(0, 5),
            referralCode: profile.referral_code
        };
        
        console.log('📊 AGENT: Stats fetched - Total:', stats.totalSubordinates, 'Today:', stats.todaySubordinates);
        return stats;
        
    } catch (error) {
        console.error('❌ AGENT: Stats error:', error);
        return getDemoSubordinateStats();
    }
}

/**
 * Generate demo subordinate statistics
 * @returns {Object} Demo statistics
 */
function getDemoSubordinateStats() {
    const demoNames = ['Player_One', 'LuckyStar', 'BigWinner', 'CasinoKing', 'DiamondPro', 'RoyalFlush', 'JackpotHunter', 'GoldenAce'];
    const recentSubordinates = [];
    
    // Generate 3-7 random demo subordinates
    const count = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
        const name = demoNames[Math.floor(Math.random() * demoNames.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        recentSubordinates.push({
            username: name + '_' + Math.floor(Math.random() * 100),
            casino_id: Math.floor(100000000 + Math.random() * 900000000).toString(),
            created_at: date.toISOString(),
            vip_level: Math.floor(Math.random() * 3)
        });
    }
    
    recentSubordinates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const todayCount = recentSubordinates.filter(u => {
        const d = new Date(u.created_at);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    }).length;
    
    return {
        totalSubordinates: 12 + Math.floor(Math.random() * 40),
        todaySubordinates: todayCount,
        recentSubordinates: recentSubordinates.slice(0, 5),
        referralCode: 'DEMO' + Math.random().toString(36).substring(2, 6).toUpperCase()
    };
}

// ============================================
// SECTION 4: UI RENDERING
// ============================================

/**
 * Initialize the Agent Center dashboard
 * Binds referral link and loads subordinate data
 */
async function initializeAgentCenter() {
    try {
        console.log('👥 AGENT: Initializing Agent Center...');
        
        // Step 1: Generate and display referral link
        await updateReferralLinkDisplay();
        
        // Step 2: Load subordinate statistics
        await updateSubordinateDisplay();
        
        // Step 3: Setup auto-refresh
        setupAgentAutoRefresh();
        
        console.log('✅ AGENT: Agent Center initialized');
        
    } catch (error) {
        console.error('❌ AGENT: Initialization error:', error);
    }
}

/**
 * Update the referral link display in the UI
 * Binds to the referral link input field
 */
async function updateReferralLinkDisplay() {
    try {
        const referralData = await generateReferralLink();
        
        // Update referral link input
        const referralInput = document.getElementById('referral-link');
        if (referralInput) {
            referralInput.value = referralData.link;
            console.log('✅ AGENT: Referral link bound to UI');
        }
        
        // Update referral code display if exists
        const codeDisplay = document.getElementById('referral-code-display');
        if (codeDisplay) {
            codeDisplay.textContent = referralData.code;
        }
        
        // Update user ID display if exists
        const idDisplay = document.getElementById('agent-user-id');
        if (idDisplay) {
            idDisplay.textContent = referralData.userId;
        }
        
        // Store for copy function
        window._agentReferralLink = referralData.link;
        
    } catch (error) {
        console.error('❌ AGENT: Display update error:', error);
    }
}

/**
 * Update subordinate statistics in the UI
 * Populates count cards and recent list
 */
async function updateSubordinateDisplay() {
    try {
        const stats = await fetchSubordinateStats();
        
        // Update total count
        const totalCountEl = document.getElementById('total-referrals');
        if (totalCountEl) {
            totalCountEl.textContent = stats.totalSubordinates;
        }
        
        // Update today count
        const todayCountEl = document.getElementById('today-referrals');
        if (todayCountEl) {
            todayCountEl.textContent = stats.todaySubordinates;
        }
        
        // Update referral code badge
        const codeBadge = document.getElementById('agent-code-badge');
        if (codeBadge) {
            codeBadge.textContent = 'Code: ' + (stats.referralCode || '---');
        }
        
        // Render recent subordinates list
        renderSubordinateList(stats.recentSubordinates);
        
        console.log('📊 AGENT: Stats display updated');
        
    } catch (error) {
        console.error('❌ AGENT: Stats display error:', error);
    }
}

/**
 * Render the recent subordinates list
 * @param {Array} subordinates - Array of subordinate user objects
 */
function renderSubordinateList(subordinates) {
    try {
        const listContainer = document.getElementById('subordinates-list');
        if (!listContainer) {
            // Try to find in invite view
            const inviteView = document.getElementById('invite-view');
            if (inviteView) {
                // Create list if doesn't exist
                let existingList = document.getElementById('subordinates-list');
                if (!existingList) {
                    existingList = document.createElement('div');
                    existingList.id = 'subordinates-list';
                    existingList.style.cssText = 'margin-top:12px;';
                    
                    // Add header
                    const header = document.createElement('h4');
                    header.style.cssText = 'color:#00b0ff;font-size:11px;font-weight:bold;margin-bottom:8px;';
                    header.textContent = '👥 Recent Subordinates';
                    existingList.appendChild(header);
                    
                    // Find commission overview card to append after
                    const commissionCard = inviteView.querySelector('.bg-white\\/5');
                    if (commissionCard && commissionCard.nextSibling) {
                        commissionCard.parentNode.insertBefore(existingList, commissionCard.nextSibling.nextSibling);
                    } else {
                        inviteView.appendChild(existingList);
                    }
                }
            }
            return;
        }
        
        // Clear existing (except header)
        const cards = listContainer.querySelectorAll('.subordinate-card');
        cards.forEach(card => card.remove());
        
        if (!subordinates || subordinates.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'text-align:center;padding:15px;color:rgba(255,255,255,0.3);font-size:10px;';
            emptyMsg.textContent = 'No subordinates yet. Share your link!';
            listContainer.appendChild(emptyMsg);
            return;
        }
        
        // Render each subordinate
        subordinates.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'subordinate-card';
            card.style.cssText = `
                background:rgba(0,0,0,0.2);
                border:1px solid rgba(255,255,255,0.06);
                border-radius:10px;
                padding:10px 12px;
                margin-bottom:6px;
                display:flex;
                align-items:center;
                justify-content:space-between;
            `;
            
            const vipTitles = ['🥉', '🥈', '🥇', '💎', '👑', '🌟'];
            const vipIcon = vipTitles[sub.vip_level] || '🥉';
            const joinDate = formatAgentDate(sub.created_at);
            
            card.innerHTML = `
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;">${vipIcon}</span>
                    <div>
                        <span style="color:white;font-size:10px;font-weight:bold;">${sub.username || 'Player'}</span>
                        <span style="color:rgba(255,255,255,0.4);font-size:8px;display:block;">ID: ${(sub.casino_id || '---').substring(0, 8)}</span>
                    </div>
                </div>
                <span style="color:rgba(255,255,255,0.4);font-size:8px;">${joinDate}</span>
            `;
            
            listContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('❌ AGENT: Render subordinates error:', error);
    }
}

// ============================================
// SECTION 5: COPY LINK HANDLER
// ============================================

/**
 * Handle copy link button click
 * Called from the "Copy" button in invite view
 */
async function handleCopyReferralLink() {
    try {
        const link = window._agentReferralLink || (await generateReferralLink()).link;
        await copyReferralLink(link);
    } catch (error) {
        console.error('❌ AGENT: Copy handler error:', error);
        showAgentToast('❌ Failed to copy. Try again.');
    }
}

// ============================================
// SECTION 6: AUTO-REFRESH
// ============================================

let agentRefreshInterval = null;

/**
 * Setup auto-refresh for agent dashboard
 */
function setupAgentAutoRefresh() {
    // Clear existing
    if (agentRefreshInterval) {
        clearInterval(agentRefreshInterval);
    }
    
    agentRefreshInterval = setInterval(async () => {
        console.log('🔄 AGENT: Auto-refreshing...');
        await updateSubordinateDisplay();
    }, AGENT_CONFIG.REFRESH_INTERVAL);
    
    console.log('🔄 AGENT: Auto-refresh started');
}

/**
 * Stop auto-refresh
 */
function stopAgentAutoRefresh() {
    if (agentRefreshInterval) {
        clearInterval(agentRefreshInterval);
        agentRefreshInterval = null;
    }
}

// ============================================
// SECTION 7: TOAST NOTIFICATION
// ============================================

/**
 * Show a toast notification for agent actions
 * @param {string} message - Message to display
 */
function showAgentToast(message) {
    try {
        // Try using global toast if available
        if (typeof window.emeraldDB?.showToast === 'function') {
            window.emeraldDB.showToast(message);
            return;
        }
        
        // Fallback toast
        const existingToast = document.getElementById('agent-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.id = 'agent-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position:fixed;
            bottom:100px;
            left:50%;
            transform:translateX(-50%);
            background:#02231c;
            color:#00e676;
            padding:12px 24px;
            border-radius:25px;
            font-size:13px;
            font-weight:bold;
            z-index:9999;
            border:1px solid rgba(0,230,118,0.3);
            box-shadow:0 10px 30px rgba(0,0,0,0.5);
            animation:fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
    } catch (error) {
        console.error('❌ AGENT: Toast error:', error);
    }
}

// ============================================
// SECTION 8: UTILITY FUNCTIONS
// ============================================

/**
 * Format date for agent display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted relative date
 */
function formatAgentDate(dateString) {
    try {
        if (!dateString) return '--';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';
        
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
        
    } catch (error) {
        return '--';
    }
}

// ============================================
// SECTION 9: COPY REFERRAL (GLOBAL)
// ============================================

// Override the existing copyReferral function to use agent system
window.copyReferral = async function() {
    await handleCopyReferralLink();
};

// Also expose as agent-specific function
window.copyAgentLink = handleCopyReferralLink;

// ============================================
// SECTION 10: INVITE VIEW ENHANCEMENT
// ============================================

/**
 * Enhance the invite view with agent data when it becomes visible
 */
function enhanceInviteView() {
    try {
        // Watch for hash changes to detect invite view
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#invite-view') {
                setTimeout(async () => {
                    await updateReferralLinkDisplay();
                    await updateSubordinateDisplay();
                }, 300);
            }
        });
        
        // Also check on load
        if (window.location.hash === '#invite-view') {
            setTimeout(async () => {
                await updateReferralLinkDisplay();
                await updateSubordinateDisplay();
            }, 500);
        }
        
        console.log('👥 AGENT: Invite view enhancement active');
        
    } catch (error) {
        console.error('❌ AGENT: Invite enhancement error:', error);
    }
}

// ============================================
// SECTION 11: GLOBAL EXPORT
// ============================================

window.emeraldAgent = {
    // Core functions
    init: initializeAgentCenter,
    generateLink: generateReferralLink,
    copyLink: copyReferralLink,
    getStats: fetchSubordinateStats,
    
    // UI updates
    updateLink: updateReferralLinkDisplay,
    updateStats: updateSubordinateDisplay,
    
    // Utilities
    showToast: showAgentToast,
    
    // Config
    config: AGENT_CONFIG
};

// Expose copy handler globally
window.copyReferralLink = handleCopyReferralLink;

// ============================================
// SECTION 12: AUTO-INITIALIZE
// ============================================

function initializeAgentModule() {
    try {
        console.log('👥 Initializing Agent Referral Module...');
        
        // Initialize agent center
        initializeAgentCenter();
        
        // Setup invite view enhancement
        enhanceInviteView();
        
        console.log('✅ Agent Referral Module Ready');
        console.log('📋 Available: window.emeraldAgent');
        console.log('🔗 Copy link: window.copyReferral()');
        console.log('⚠️ Commission claims NOT included - Demo Only');
        
    } catch (error) {
        console.error('❌ AGENT: Module initialization error:', error);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeAgentModule, 1000);
    });
} else {
    setTimeout(initializeAgentModule, 1000);
}

console.log('👥 Agent Referral Module v1.0.0 Loaded (No Commission Claims)');
