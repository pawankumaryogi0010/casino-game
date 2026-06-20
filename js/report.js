// ============================================
// EMERALD KING CASINO - PERFORMANCE REPORT
// File: js/report.js
// ============================================

function renderReportHistory(data) {
    const container = document.getElementById('report-history-list');
    if (!container) return;
    
    if (!data || data.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-white/30 text-xs">No sessions recorded yet</div>`;
        return;
    }
    
    container.innerHTML = data.map(row => {
        const isWin = (row.win_loss || 0) > 0;
        const statusText = isWin ? 'COMPLETED' : 'FORFEITED';
        const statusColor = isWin ? '#00e676' : '#ff4444';
        const gameName = row.game_id || 'Session';
        
        return `
            <div class="grid grid-cols-4 gap-2 p-3 text-xs hover:bg-white/5 transition-all">
                <span class="text-white truncate">${gameName}</span>
                <span class="text-white/70 text-center">${(row.bet_amount || 0).toFixed(2)}</span>
                <span class="text-center" style="color:${isWin ? '#00e676' : '#ff4444'}">${(row.win_loss || 0).toFixed(2)}</span>
                <span class="text-right" style="color:${statusColor};font-size:9px;font-weight:bold;">${statusText}</span>
            </div>
        `;
    }).join('');
}

function updateReportSummary(totalBet, totalWin) {
    const netDelta = totalWin - totalBet;
    
    const betEl = document.getElementById('report-total-bet');
    const winEl = document.getElementById('report-total-win');
    const netEl = document.getElementById('report-net-delta');
    
    if (betEl) betEl.textContent = totalBet.toFixed(2);
    if (winEl) winEl.textContent = totalWin.toFixed(2);
    if (netEl) {
        netEl.textContent = (netDelta >= 0 ? '+' : '') + netDelta.toFixed(2);
        netEl.style.color = netDelta >= 0 ? '#00e676' : '#ff4444';
    }
}

async function loadReportData() {
    try {
        // REPLACE THIS with your actual Supabase query
        // const client = window.emeraldDB.getClient();
        // const { data: { user } } = await client.auth.getUser();
        // const { data } = await client.from('game_sessions')...
        
        // Static placeholder for now
        updateReportSummary(0, 0);
        renderReportHistory([]);
        
    } catch (error) {
        console.error('Report error:', error);
    }
}

// Listen for hash changes
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#report-view') {
        loadReportData();
    }
});

// Initial load if on report view
if (window.location.hash === '#report-view') {
    loadReportData();
}

console.log('📊 Report module ready');
