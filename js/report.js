// ============================================
// EMERALD KING CASINO - PERFORMANCE REPORT
// Tracks skill-based gaming metrics
// File: js/report.js
// Version: 1.0.0
// ============================================

// ============================================
// SECTION 1: REPORT DATA FETCHING
// ============================================

/**
 * Fetch today's performance metrics for the current user
 * Queries game_sessions for allocation_weight and yield_recovered
 * @returns {Promise<Object>} Report data with summary and history
 */
async function fetchReportData() {
    try {
        // Check database availability
        if (!window.emeraldDB || !window.emeraldDB.isReady || !window.emeraldDB.isReady()) {
            console.warn('⚠️ REPORT: Database not available, using demo data');
            return getDemoReportData();
        }
        
        const client = window.emeraldDB.getClient();
        if (!client) return getDemoReportData();
        
        // Get current user
        const { data: { user }, error: authError } = await client.auth.getUser();
        if (authError || !user) {
            console.warn('⚠️ REPORT: No authenticated user');
            return getDemoReportData();
        }
        
        // Get today's date at midnight UTC
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayISO = today.toISOString();
        
        // Fetch today's sessions with optimized query (uses index)
        const { data: todaySessions, error: todayError } = await client
            .from('game_sessions')
            .select('allocation_weight, yield_recovered')
            .eq('user_id', user.id)
            .gte('created_at', todayISO)
            .order('created_at', { ascending: false });
        
        if (todayError) {
            console.error('❌ REPORT: Today fetch error:', todayError);
        }
        
        // Fetch last 50 sessions for history
        const { data: historySessions, error: historyError } = await client
            .from('game_sessions')
            .select('game_identifier, allocation_weight, yield_recovered, multiplier, settlement_status, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (historyError) {
            console.error('❌ REPORT: History fetch error:', historyError);
        }
        
        // Calculate today's summary metrics
        const todayMetrics = calculateSummaryMetrics(todaySessions || []);
        
        // Build report data
        const reportData = {
            summary: todayMetrics,
            history: historySessions || [],
            hasData: (todaySessions?.length || 0) > 0 || (historySessions?.length || 0) > 0
        };
        
        console.log('📊 REPORT: Data fetched -', 
            'Today:', todayMetrics.totalSessions, 'sessions |',
            'History:', reportData.history.length, 'records'
        );
        
        return reportData;
        
    } catch (error) {
        console.error('❌ REPORT: Fetch error:', error);
        return getDemoReportData();
    }
}

/**
 * Calculate summary metrics from session data
 * Uses lightweight array reduction for performance
 * @param {Array} sessions - Array of game session objects
 * @returns {Object} Calculated summary metrics
 */
function calculateSummaryMetrics(sessions) {
    // Guard against empty data
    if (!sessions || sessions.length === 0) {
        return {
            totalSessions: 0,
            totalAllocated: 0,
            totalRecovered: 0,
            netDelta: 0,
            winRate: 0
        };
    }
    
    const totalSessions = sessions.length;
    
    // Single-pass reduction for performance (avoids multiple loops)
    const totals = sessions.reduce((acc, session) => {
        acc.totalAllocated += parseFloat(session.allocation_weight || 0);
        acc.totalRecovered += parseFloat(session.yield_recovered || 0);
        return acc;
    }, { totalAllocated: 0, totalRecovered: 0 });
    
    const netDelta = totals.totalRecovered - totals.totalAllocated;
    
    // Count winning sessions (in same pass for efficiency)
    // We need separate count, so we do a quick filter
    const winCount = sessions.filter(s => s.yield_recovered > s.allocation_weight).length;
    const winRate = totalSessions > 0 ? Math.round((winCount / totalSessions) * 100) : 0;
    
    return {
        totalSessions,
        totalAllocated: Math.round(totals.totalAllocated * 100) / 100,
        totalRecovered: Math.round(totals.totalRecovered * 100) / 100,
        netDelta: Math.round(netDelta * 100) / 100,
        winRate
    };
}

/**
 * Generate demo report data for testing
 * @returns {Object} Demo report data
 */
function getDemoReportData() {
    const demoGames = [
        'Velocity Aviator', 'Nexus Slots', 'Quantum Roulette', 
        'Tactical Blackjack', 'Strategy Baccarat', 'Precision Dragon Tiger',
        'Apex Teen Patti', 'Matrix Plinko', 'Vector Mines'
    ];
    
    const demoSessions = [];
    const demoCount = 12 + Math.floor(Math.random() * 15);
    
    for (let i = 0; i < demoCount; i++) {
        const gameName = demoGames[Math.floor(Math.random() * demoGames.length)];
        const allocation = Math.floor(Math.random() * 500) + 10;
        const multiplier = Math.round((Math.random() * 3 + 0.5) * 10) / 10;
        const won = Math.random() > 0.45;
        const recovered = won ? Math.floor(allocation * multiplier) : 0;
        
        const date = new Date();
        date.setHours(date.getHours() - Math.floor(Math.random() * 72));
        
        demoSessions.push({
            game_identifier: gameName,
            allocation_weight: allocation,
            yield_recovered: recovered,
            multiplier: multiplier,
            settlement_status: won ? 'WON' : 'LOST',
            created_at: date.toISOString()
        });
    }
    
    demoSessions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const todaySessions = demoSessions.filter(s => {
        const d = new Date(s.created_at);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    });
    
    const summary = calculateSummaryMetrics(todaySessions);
    
    return {
        summary,
        history: demoSessions.slice(0, 50),
        hasData: true,
        isDemo: true
    };
}

// ============================================
// SECTION 2: UI RENDERING
// ============================================

/**
 * Load and render the complete report view
 */
async function loadReportView() {
    try {
        const reportData = await fetchReportData();
        
        // Update summary cards
        updateSummaryCards(reportData.summary);
        
        // Update history table
        updateHistoryTable(reportData.history);
        
        console.log('📊 REPORT: View loaded successfully');
        
    } catch (error) {
        console.error('❌ REPORT: Load error:', error);
        showReportError('Failed to load report data');
    }
}

/**
 * Update the three summary cards in the report view
 * @param {Object} summary - Calculated summary metrics
 */
function updateSummaryCards(summary) {
    // Total Allocated (Total allocation weight across sessions)
    const allocatedEl = document.getElementById('report-total-allocated');
    if (allocatedEl) {
        allocatedEl.textContent = summary.totalAllocated.toLocaleString('en-IN');
    }
    
    // Total Recovered (Total yield recovered)
    const recoveredEl = document.getElementById('report-total-recovered');
    if (recoveredEl) {
        recoveredEl.textContent = summary.totalRecovered.toLocaleString('en-IN');
    }
    
    // Net Delta (Performance variance)
    const netDeltaEl = document.getElementById('report-net-delta');
    if (netDeltaEl) {
        const sign = summary.netDelta >= 0 ? '+' : '';
        netDeltaEl.textContent = sign + summary.netDelta.toLocaleString('en-IN');
        
        // Color coding: green for positive, crimson for negative
        if (summary.netDelta > 0) {
            netDeltaEl.style.color = '#00e676';
            netDeltaEl.style.textShadow = '0 0 10px rgba(0, 230, 118, 0.4)';
        } else if (summary.netDelta < 0) {
            netDeltaEl.style.color = '#FF1744';
            netDeltaEl.style.textShadow = '0 0 10px rgba(255, 23, 68, 0.4)';
        } else {
            netDeltaEl.style.color = '#FFD700';
            netDeltaEl.style.textShadow = 'none';
        }
    }
    
    // Win Rate
    const winRateEl = document.getElementById('report-win-rate');
    if (winRateEl) {
        winRateEl.textContent = summary.winRate + '%';
    }
    
    // Session Count
    const sessionsEl = document.getElementById('report-session-count');
    if (sessionsEl) {
        sessionsEl.textContent = summary.totalSessions;
    }
}

/**
 * Update the history table with session records
 * @param {Array} history - Array of game session records
 */
function updateHistoryTable(history) {
    const tableBody = document.getElementById('report-history-tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (!history || history.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);">
                    <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                    No game sessions recorded yet
                </td>
            </tr>
        `;
        return;
    }
    
    // Render each session row
    history.forEach(session => {
        const row = document.createElement('tr');
        row.style.cssText = 'border-bottom:1px solid rgba(255,255,255,0.05);transition:background 0.2s;';
        row.onmouseover = () => row.style.background = 'rgba(255,255,255,0.03)';
        row.onmouseout = () => row.style.background = 'transparent';
        
        // Format data
        const gameName = session.game_identifier || 'Unknown Game';
        const allocation = parseFloat(session.allocation_weight || 0);
        const recovered = parseFloat(session.yield_recovered || 0);
        const multiplier = parseFloat(session.multiplier || 0);
        const status = session.settlement_status || 'LOST';
        const date = formatReportDate(session.created_at);
        
        // Status badge
        const isWon = status === 'WON';
        const statusColor = isWon ? '#00e676' : '#FF1744';
        const statusBg = isWon ? 'rgba(0,230,118,0.12)' : 'rgba(255,23,68,0.1)';
        const statusBorder = isWon ? 'rgba(0,230,118,0.3)' : 'rgba(255,23,68,0.25)';
        
        row.innerHTML = `
            <td style="padding:10px 6px;">
                <span style="color:white;font-size:11px;font-weight:500;">${gameName}</span>
                <span style="color:rgba(255,255,255,0.35);font-size:9px;display:block;">${date}</span>
            </td>
            <td style="padding:10px 6px;color:white;font-size:11px;text-align:center;">
                ${allocation.toLocaleString('en-IN')}
            </td>
            <td style="padding:10px 6px;text-align:center;font-size:11px;color:${isWon ? '#00e676' : '#FF1744'};">
                ${isWon ? '+' : ''}${recovered.toLocaleString('en-IN')}
            </td>
            <td style="padding:10px 6px;text-align:center;font-size:11px;color:rgba(255,255,255,0.5);">
                ${multiplier}x
            </td>
            <td style="padding:10px 6px;text-align:center;">
                <span style="
                    display:inline-block;
                    padding:3px 10px;
                    border-radius:12px;
                    font-size:9px;
                    font-weight:bold;
                    letter-spacing:0.5px;
                    color:${statusColor};
                    background:${statusBg};
                    border:1px solid ${statusBorder};
                ">${isWon ? '✓ WON' : '✗ LOST'}</span>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Show error state in the report view
 * @param {string} message - Error message
 */
function showReportError(message) {
    const tableBody = document.getElementById('report-history-tbody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:30px;color:#ff4444;">
                    <i class="fas fa-exclamation-circle" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                    ${message}
                </td>
            </tr>
        `;
    }
}

// ============================================
// SECTION 3: UTILITY FUNCTIONS
// ============================================

/**
 * Format date for report display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted relative date
 */
function formatReportDate(dateString) {
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
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '--';
    }
}

// ============================================
// SECTION 4: AUTO-REFRESH & HASH LISTENER
// ============================================

let reportRefreshInterval = null;

/**
 * Listen for hash changes to detect report view
 */
function setupReportHashListener() {
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#report-view') {
            setTimeout(() => loadReportView(), 200);
            startReportAutoRefresh();
        } else {
            stopReportAutoRefresh();
        }
    });
    
    // Initial load if already on report view
    if (window.location.hash === '#report-view') {
        setTimeout(() => loadReportView(), 300);
        startReportAutoRefresh();
    }
}

/**
 * Start auto-refresh for report data
 */
function startReportAutoRefresh() {
    stopReportAutoRefresh();
    reportRefreshInterval = setInterval(() => {
        loadReportView();
    }, 30000); // Refresh every 30 seconds
}

/**
 * Stop auto-refresh
 */
function stopReportAutoRefresh() {
    if (reportRefreshInterval) {
        clearInterval(reportRefreshInterval);
        reportRefreshInterval = null;
    }
}

// ============================================
// SECTION 5: GLOBAL EXPORT
// ============================================

window.emeraldReport = {
    load: loadReportView,
    fetch: fetchReportData,
    calculate: calculateSummaryMetrics,
    refresh: loadReportView
};

// ============================================
// SECTION 6: AUTO-INITIALIZE
// ============================================

function initializeReportModule() {
    try {
        console.log('📊 Initializing Performance Report Module...');
        
        setupReportHashListener();
        
        console.log('✅ Performance Report Module Ready');
        console.log('📋 Available: window.emeraldReport');
        
    } catch (error) {
        console.error('❌ REPORT: Initialization error:', error);
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeReportModule, 800);
    });
} else {
    setTimeout(initializeReportModule, 800);
}

console.log('📊 Performance Report Module v1.0.0 Loaded');
