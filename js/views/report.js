// ============================================
// REPORT VIEW
// File: js/views/report.js
// ============================================

function renderReportView(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <h3 class="text-white font-bold text-lg mb-4"><i class="fas fa-chart-line text-neon-mint mr-2"></i>Performance Report</h3>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="glass-card rounded-xl p-4 text-center"><span class="text-white/50 text-[9px] uppercase">Total Allocated</span><p class="text-white font-bold text-lg mt-1" id="report-allocated">0</p></div>
                <div class="glass-card rounded-xl p-4 text-center"><span class="text-white/50 text-[9px] uppercase">Total Recovered</span><p class="text-neon-mint font-bold text-lg mt-1" id="report-recovered">0</p></div>
                <div class="glass-card rounded-xl p-4 text-center"><span class="text-white/50 text-[9px] uppercase">Net Delta</span><p class="font-bold text-lg mt-1" id="report-delta">0</p></div>
                <div class="glass-card rounded-xl p-4 text-center"><span class="text-white/50 text-[9px] uppercase">Win Rate</span><p class="text-neon-blue font-bold text-lg mt-1" id="report-winrate">0%</p></div>
            </div>
            <div class="glass-card rounded-xl overflow-hidden">
                <div style="display:grid;grid-template-columns:2fr 1fr 1fr 0.8fr 1fr;gap:4px;padding:10px 8px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.4);font-size:9px;font-weight:bold;text-transform:uppercase;"><span>Strategy</span><span style="text-align:center;">Allocated</span><span style="text-align:center;">Recovered</span><span style="text-align:center;">Multi</span><span style="text-align:right;">Status</span></div>
                <div style="max-height:45vh;overflow-y:auto;"><table style="width:100%;border-collapse:collapse;"><tbody id="report-tbody"><tr><td colspan="5" style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);">Loading data...</td></tr></tbody></table></div>
            </div>
        </div>`;
}

console.log('✅ Report view loaded');
