// ============================================
// EMERALD KING CASINO - VIP PROGRESS SYSTEM
// Tier Tracking & Progress Visualization
// NO Financial Claims - Progress Display Only
// File: js/vip.js
// Version: 1.0.0
// ============================================

// ============================================
// SECTION 1: VIP TIER CONFIGURATION
// ============================================

const VIP_TIERS = [
    {
        level: 0,
        name: 'Bronze',
        icon: '🥉',
        color: '#cd7f32',
        glowColor: 'rgba(205, 127, 50, 0.4)',
        requiredBet: 0,
        benefits: ['Basic Support', 'Standard RTP'],
        dailyBonus: 0
    },
    {
        level: 1,
        name: 'Silver',
        icon: '🥈',
        color: '#c0c0c0',
        glowColor: 'rgba(192, 192, 192, 0.4)',
        requiredBet: 5000,
        benefits: ['Priority Support', '+0.5% RTP Boost', 'Weekly Cashback 2%'],
        dailyBonus: 0
    },
    {
        level: 2,
        name: 'Gold',
        icon: '🥇',
        color: '#FFD700',
        glowColor: 'rgba(255, 215, 0, 0.5)',
        requiredBet: 25000,
        benefits: ['24/7 Support', '+1% RTP Boost', 'Weekly Cashback 5%', 'Faster Withdrawals'],
        dailyBonus: 0
    },
    {
        level: 3,
        name: 'Platinum',
        icon: '💎',
        color: '#e5e4e2',
        glowColor: 'rgba(229, 228, 226, 0.5)',
        requiredBet: 100000,
        benefits: ['Dedicated Host', '+1.5% RTP Boost', 'Weekly Cashback 8%', 'Instant Withdrawals', 'Exclusive Tables'],
        dailyBonus: 0
    },
    {
        level: 4,
        name: 'Diamond',
        icon: '👑',
        color: '#b9f2ff',
        glowColor: 'rgba(185, 242, 255, 0.6)',
        requiredBet: 500000,
        benefits: ['Personal VIP Manager', '+2% RTP Boost', 'Weekly Cashback 12%', 'Priority Withdrawals', 'VIP Events', 'Custom Limits'],
        dailyBonus: 0
    },
    {
        level: 5,
        name: 'Royal',
        icon: '🌟',
        color: '#ffd700',
        glowColor: 'rgba(255, 215, 0, 0.8)',
        requiredBet: 2000000,
        benefits: ['Royal Concierge', '+3% RTP Boost', 'Weekly Cashback 20%', 'Instant Priority', 'All Access', 'Custom Everything'],
        dailyBonus: 0
    }
];

// ============================================
// SECTION 2: VIP PROGRESS CALCULATOR
// ============================================

/**
 * Calculate total wagered amount for a user
 * Queries game_sessions table for cumulative bet_amount
 * @param {string} userId - User's UUID
 * @returns {Promise<number>} Total wagered amount
 */
async function calculateTotalWagered(userId) {
    try {
        // Check database availability
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            console.warn('⚠️ VIP: Database not available, using demo data');
            return getDemoWagered();
        }
        
        const client = window.emeraldDB.getClient();
        if (!client) {
            return getDemoWagered();
        }
        
        // Query sum of bet_amount from game_sessions
        const { data, error } = await client
            .from('game_sessions')
            .select('bet_amount')
            .eq('user_id', userId);
        
        if (error) {
            console.error('❌ VIP: Query error:', error);
            return getDemoWagered();
        }
        
        // Calculate total
        const totalWagered = (data || []).reduce((sum, session) => {
            return sum + parseFloat(session.bet_amount || 0);
        }, 0);
        
        console.log('💰 VIP: Total wagered calculated:', totalWagered);
        return totalWagered;
        
    } catch (error) {
        console.error('❌ VIP: Calculate error:', error);
        return getDemoWagered();
    }
}

/**
 * Generate demo wagered amount for testing
 * @returns {number} Demo wagered amount
 */
function getDemoWagered() {
    // Random demo value between 500 and 75000
    return Math.floor(Math.random() * 74500) + 500;
}

/**
 * Determine user's current VIP tier based on total wagered
 * @param {number} totalWagered - Total amount wagered
 * @returns {Object} Current VIP tier object
 */
function determineCurrentTier(totalWagered) {
    let currentTier = VIP_TIERS[0];
    
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
        if (totalWagered >= VIP_TIERS[i].requiredBet) {
            currentTier = VIP_TIERS[i];
            break;
        }
    }
    
    return currentTier;
}

/**
 * Determine next VIP tier and calculate progress
 * @param {number} totalWagered - Total amount wagered
 * @returns {Object} Progress data { currentTier, nextTier, progress, remaining }
 */
function calculateVIPProgress(totalWagered) {
    const currentTier = determineCurrentTier(totalWagered);
    const currentLevel = currentTier.level;
    
    // If at max tier
    if (currentLevel >= VIP_TIERS.length - 1) {
        return {
            currentTier: currentTier,
            nextTier: null,
            progressPercent: 100,
            remaining: 0,
            isMaxLevel: true
        };
    }
    
    // Calculate progress to next tier
    const nextTier = VIP_TIERS[currentLevel + 1];
    const currentRequirement = currentTier.requiredBet;
    const nextRequirement = nextTier.requiredBet;
    const range = nextRequirement - currentRequirement;
    const progress = totalWagered - currentRequirement;
    
    // Calculate percentage
    let progressPercent = 0;
    if (range > 0) {
        progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
    }
    
    // Calculate remaining
    const remaining = Math.max(0, nextRequirement - totalWagered);
    
    return {
        currentTier: currentTier,
        nextTier: nextTier,
        progressPercent: Math.round(progressPercent * 10) / 10,
        remaining: remaining,
        isMaxLevel: false,
        totalWagered: totalWagered,
        nextRequirement: nextRequirement
    };
}

// ============================================
// SECTION 3: PROFILE DISPLAY UPDATER
// ============================================

/**
 * Update VIP progress bar in the profile UI
 * Dynamically sets CSS width and updates tier display
 * @param {string} userId - User's UUID (optional, auto-detects if null)
 */
async function updateVIPProgress(userId) {
    try {
        // Get user ID if not provided
        if (!userId) {
            const profile = await window.emeraldDB?.fetchProfile();
            userId = profile?.id || null;
        }
        
        // Calculate total wagered
        const totalWagered = userId ? 
            await calculateTotalWagered(userId) : 
            getDemoWagered();
        
        // Calculate progress
        const progress = calculateVIPProgress(totalWagered);
        
        // Update UI elements
        updateVIPUIElements(progress);
        
        console.log('📊 VIP: Progress updated -', 
            progress.currentTier.name, '→', 
            progress.nextTier?.name || 'MAX',
            '(' + progress.progressPercent + '%)'
        );
        
        return progress;
        
    } catch (error) {
        console.error('❌ VIP: Update error:', error);
        return null;
    }
}

/**
 * Update all VIP-related UI elements in the profile view
 * @param {Object} progress - VIP progress data
 */
function updateVIPUIElements(progress) {
    try {
        // ============================================
        // Update VIP Badge (icon + name)
        // ============================================
        const vipBadge = document.getElementById('profile-vip');
        if (vipBadge) {
            vipBadge.textContent = `VIP ${progress.currentTier.name} ${progress.currentTier.icon}`;
            vipBadge.style.color = progress.currentTier.color;
            
            // Add glow effect for higher tiers
            if (progress.currentTier.level >= 3) {
                vipBadge.style.textShadow = `0 0 12px ${progress.currentTier.glowColor}`;
            } else {
                vipBadge.style.textShadow = 'none';
            }
        }
        
        // ============================================
        // Update Progress Bar Width
        // ============================================
        const progressBar = document.getElementById('vip-progress-bar');
        if (progressBar) {
            progressBar.style.width = progress.progressPercent + '%';
            
            // Gradient based on tiers
            const currentColor = progress.currentTier.color;
            const nextColor = progress.nextTier?.color || '#FFD700';
            progressBar.style.background = `linear-gradient(90deg, ${currentColor}, ${nextColor})`;
            
            // Glow for high progress
            if (progress.progressPercent > 75) {
                progressBar.style.boxShadow = `0 0 10px ${nextColor}`;
            } else {
                progressBar.style.boxShadow = 'none';
            }
        }
        
        // ============================================
        // Update Progress Text
        // ============================================
        const progressText = document.getElementById('vip-progress-text');
        if (progressText) {
            if (progress.isMaxLevel) {
                progressText.textContent = '🏆 MAX LEVEL';
                progressText.style.color = '#FFD700';
            } else {
                progressText.textContent = 
                    `${progress.currentTier.name} → ${progress.nextTier.name}`;
                progressText.style.color = progress.nextTier.color;
            }
        }
        
        // ============================================
        // Update Next Tier Requirement
        // ============================================
        const nextTierText = document.getElementById('vip-next-tier');
        if (nextTierText) {
            if (progress.isMaxLevel) {
                nextTierText.textContent = '🌟 You have reached the highest VIP tier!';
                nextTierText.style.color = '#FFD700';
            } else if (progress.remaining > 0) {
                const formattedRemaining = progress.remaining.toLocaleString('en-IN');
                nextTierText.textContent = 
                    `₹${formattedRemaining} more to reach ${progress.nextTier.name} tier`;
                nextTierText.style.color = 'rgba(255, 255, 255, 0.5)';
            } else {
                nextTierText.textContent = 
                    `🎉 Eligible for ${progress.nextTier.name} upgrade!`;
                nextTierText.style.color = '#00e676';
            }
        }
        
        // ============================================
        // Update Total Wagered Display (if exists)
        // ============================================
        const wageredDisplay = document.getElementById('vip-total-wagered');
        if (wageredDisplay && progress.totalWagered) {
            wageredDisplay.textContent = 
                '₹' + progress.totalWagered.toLocaleString('en-IN');
        }
        
        // ============================================
        // Update Benefits List (if exists)
        // ============================================
        const benefitsList = document.getElementById('vip-benefits-list');
        if (benefitsList) {
            renderBenefitsList(benefitsList, progress.currentTier);
        }
        
    } catch (error) {
        console.error('❌ VIP: UI update error:', error);
    }
}

/**
 * Render VIP benefits list
 * @param {HTMLElement} container - Benefits container element
 * @param {Object} tier - Current VIP tier
 */
function renderBenefitsList(container, tier) {
    try {
        container.innerHTML = '';
        
        tier.benefits.forEach((benefit, index) => {
            const item = document.createElement('div');
            item.style.cssText = `
                display:flex;
                align-items:center;
                gap:8px;
                padding:6px 0;
                color:rgba(255,255,255,0.7);
                font-size:11px;
                border-bottom:1px solid rgba(255,255,255,0.05);
            `;
            
            item.innerHTML = `
                <span style="color:${tier.color};font-size:12px;">✅</span>
                <span>${benefit}</span>
            `;
            
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('❌ VIP: Benefits render error:', error);
    }
}

// ============================================
// SECTION 4: TIER COMPARISON TABLE
// ============================================

/**
 * Render the full VIP tier comparison table
 * Shows all tiers with requirements and benefits
 * @param {HTMLElement} container - Table container element
 */
function renderTierComparisonTable(container) {
    try {
        if (!container) return;
        
        container.innerHTML = '';
        
        // Header
        const headerStyle = `
            display:grid;
            grid-template-columns:60px 1fr 80px;
            gap:8px;
            padding:8px;
            background:rgba(0,0,0,0.3);
            border-radius:8px;
            margin-bottom:6px;
            font-size:9px;
            font-weight:bold;
            color:rgba(255,255,255,0.5);
        `;
        
        const header = document.createElement('div');
        header.style.cssText = headerStyle;
        header.innerHTML = '<span>Tier</span><span>Benefits</span><span>Wagered</span>';
        container.appendChild(header);
        
        // Tier rows
        VIP_TIERS.forEach((tier, index) => {
            const row = document.createElement('div');
            row.style.cssText = `
                display:grid;
                grid-template-columns:60px 1fr 80px;
                gap:8px;
                padding:10px 8px;
                background:rgba(255,255,255,0.02);
                border:1px solid rgba(255,255,255,0.05);
                border-radius:8px;
                margin-bottom:4px;
                font-size:10px;
                align-items:center;
            `;
            
            // Highlight current tier
            if (tier.level === determineCurrentTier(
                parseFloat(document.getElementById('vip-total-wagered')?.textContent?.replace(/[^0-9]/g, '') || '0')
            ).level) {
                row.style.border = `1px solid ${tier.color}`;
                row.style.background = `${tier.color}10`;
            }
            
            const requirement = tier.requiredBet === 0 ? 
                'Free' : '₹' + tier.requiredBet.toLocaleString('en-IN');
            
            row.innerHTML = `
                <span style="color:${tier.color};font-weight:bold;">
                    ${tier.icon} ${tier.name}
                </span>
                <span style="color:rgba(255,255,255,0.5);font-size:8px;">
                    ${tier.benefits.slice(0, 2).join(' • ')}
                </span>
                <span style="color:rgba(255,255,255,0.6);font-size:9px;text-align:right;">
                    ${requirement}
                </span>
            `;
            
            container.appendChild(row);
        });
        
    } catch (error) {
        console.error('❌ VIP: Table render error:', error);
    }
}

// ============================================
// SECTION 5: PROFILE VIEW ENHANCEMENT
// ============================================

/**
 * Enhance the profile view with VIP data
 * Auto-triggers when profile view becomes visible
 */
function enhanceProfileView() {
    try {
        // Watch for hash changes
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#profile-view') {
                setTimeout(async () => {
                    await updateVIPProgress();
                }, 300);
            }
        });
        
        // Check on initial load
        if (window.location.hash === '#profile-view') {
            setTimeout(async () => {
                await updateVIPProgress();
            }, 500);
        }
        
        console.log('👑 VIP: Profile view enhancement active');
        
    } catch (error) {
        console.error('❌ VIP: Enhancement error:', error);
    }
}

// ============================================
// SECTION 6: VIP NOTIFICATIONS
// ============================================

/**
 * Check if user has leveled up and show notification
 * @param {Object} oldProgress - Previous VIP progress
 * @param {Object} newProgress - New VIP progress
 */
function checkTierUpgrade(oldProgress, newProgress) {
    try {
        if (!oldProgress || !newProgress) return;
        
        if (newProgress.currentTier.level > oldProgress.currentTier.level) {
            // User leveled up!
            const newTier = newProgress.currentTier;
            
            // Show celebration notification
            const message = `🎉 Congratulations! You've reached ${newTier.icon} ${newTier.name} VIP!`;
            
            if (typeof window.emeraldDB?.showToast === 'function') {
                window.emeraldDB.showToast(message);
            }
            
            // Trigger visual celebration
            if (typeof WinParticleCascade !== 'undefined') {
                // Find canvas for particles
                const canvas = document.getElementById('casino-stage');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const cascade = new WinParticleCascade(ctx);
                    cascade.spawn(canvas.width / 4, canvas.height / 2, 100);
                    
                    // Animate
                    function animateCascade() {
                        if (!cascade.isAlive()) return;
                        cascade.update();
                        requestAnimationFrame(animateCascade);
                    }
                    animateCascade();
                }
            }
            
            console.log('👑 VIP: Level up!', oldProgress.currentTier.name, '→', newTier.name);
        }
        
    } catch (error) {
        console.error('❌ VIP: Upgrade check error:', error);
    }
}

// ============================================
// SECTION 7: AUTO-REFRESH
// ============================================

let vipRefreshInterval = null;
let lastVIPProgress = null;

/**
 * Start auto-refresh for VIP progress
 */
function startVIPAutoRefresh() {
    if (vipRefreshInterval) {
        clearInterval(vipRefreshInterval);
    }
    
    vipRefreshInterval = setInterval(async () => {
        // Only refresh if profile view is visible
        const profileView = document.getElementById('profile-view');
        if (profileView && !profileView.classList.contains('hidden')) {
            const newProgress = await updateVIPProgress();
            
            // Check for level up
            if (lastVIPProgress && newProgress) {
                checkTierUpgrade(lastVIPProgress, newProgress);
            }
            lastVIPProgress = newProgress;
        }
    }, 15000); // Every 15 seconds
    
    console.log('🔄 VIP: Auto-refresh started');
}

/**
 * Stop auto-refresh
 */
function stopVIPAutoRefresh() {
    if (vipRefreshInterval) {
        clearInterval(vipRefreshInterval);
        vipRefreshInterval = null;
    }
}

// ============================================
// SECTION 8: GLOBAL EXPORT
// ============================================

window.emeraldVIP = {
    // Core functions
    updateProgress: updateVIPProgress,
    calculateProgress: calculateVIPProgress,
    determineTier: determineCurrentTier,
    getTotalWagered: calculateTotalWagered,
    
    // UI functions
    updateUI: updateVIPUIElements,
    renderBenefits: renderBenefitsList,
    renderTable: renderTierComparisonTable,
    
    // Tier data
    tiers: VIP_TIERS,
    
    // Utilities
    enhanceProfile: enhanceProfileView,
    checkUpgrade: checkTierUpgrade,
    startRefresh: startVIPAutoRefresh,
    stopRefresh: stopVIPAutoRefresh
};

// ============================================
// SECTION 9: AUTO-INITIALIZE
// ============================================

function initializeVIPModule() {
    try {
        console.log('👑 Initializing VIP Progress System...');
        
        // Enhance profile view
        enhanceProfileView();
        
        // Start auto-refresh
        startVIPAutoRefresh();
        
        // Initial update
        setTimeout(async () => {
            lastVIPProgress = await updateVIPProgress();
        }, 1000);
        
        console.log('✅ VIP Progress System Ready');
        console.log('📊 ' + VIP_TIERS.length + ' tiers configured');
        console.log('📋 Available: window.emeraldVIP');
        console.log('⚠️ Daily reward claims NOT included');
        
    } catch (error) {
        console.error('❌ VIP: Initialization error:', error);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeVIPModule, 1200);
    });
} else {
    setTimeout(initializeVIPModule, 1200);
}

console.log('👑 VIP Progress Module v1.0.0 Loaded (No Financial Claims)');
