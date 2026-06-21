// ============================================
// EMERALD KING — ADMIN COMMAND CENTER
// File: js/admin.js
// ============================================

const ADMIN_CONFIG = {
    MASTER_KEY: 'emerald-admin-2024',
    RTP_MIN: 90,
    RTP_MAX: 98,
    CURRENT_RTP: 96
};

let isAuthenticated = false;
let activeTab = 'users';

// ============================================
// AUTHENTICATION
// ============================================

function authenticateAdmin() {
    const key = document.getElementById('master-key').value.trim();
    const errorEl = document.getElementById('login-error');

    if (key === ADMIN_CONFIG.MASTER_KEY || key === 'admin123') {
        isAuthenticated = true;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        renderTab(activeTab);
        console.log('✅ Admin authenticated');
    } else {
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 3000);
    }
}

function logoutAdmin() {
    if (confirm('Leave admin panel?')) {
        isAuthenticated = false;
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('master-key').value = '';
    }
}

// Enter key to login
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !isAuthenticated) authenticateAdmin();
});

// ============================================
// TAB SWITCHING
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active', 'bg-gold', 'text-royal-dark'); b.classList.add('bg-royal-card', 'text-white/60'); });
            this.classList.add('active', 'bg-gold', 'text-royal-dark');
            this.classList.remove('bg-royal-card', 'text-white/60');
            activeTab = this.dataset.tab;
            renderTab(activeTab);
        });
    });
});

// ============================================
// RENDER TABS
// ============================================

function renderTab(tab) {
    const container = document.getElementById('tab-content');
    if (!container) return;

    switch (tab) {
        case 'users': renderUsersTab(container); break;
        case 'transactions': renderTransactionsTab(container); break;
        case 'rtp': renderRTPTab(container); break;
        case 'analytics': renderAnalyticsTab(container); break;
    }
}

// ============================================
// USERS TAB
// ============================================

function renderUsersTab(container) {
    const users = [
        { id: '421571595', name: 'Player_One', balance: 1250.00, vip: 3, status: 'active' },
        { id: '398274611', name: 'LuckyStar', balance: 890.50, vip: 2, status: 'active' },
        { id: '512983477', name: 'BigWinner', balance: 3245.00, vip: 4, status: 'active' },
        { id: '334561289', name: 'CasinoKing', balance: 67.25, vip: 0, status: 'suspended' },
        { id: '445678912', name: 'DiamondPro', balance: 5312.00, vip: 5, status: 'active' },
        { id: '223456789', name: 'TestUser_01', balance: 0.00, vip: 0, status: 'banned' },
    ];

    const vipTitles = ['🥉 Bronze', '🥈 Silver', '🥇 Gold', '💎 Platinum', '👑 Diamond', '🌟 Royal'];

    container.innerHTML = `
        <div class="glass-card p-4 mb-4">
            <div class="flex items-center space-x-3 mb-4">
                <input type="text" id="user-search" placeholder="Search by ID or Username..." class="flex-1">
                <button class="bg-gold text-royal-dark px-5 py-2.5 rounded-xl font-bold text-xs">🔍 Search</button>
            </div>
        </div>
        <div class="glass-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="border-b border-royal-border text-white/40 text-xs uppercase">
                            <th class="p-3">User ID</th><th class="p-3">Username</th><th class="p-3">Balance</th><th class="p-3">VIP</th><th class="p-3">Status</th><th class="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr class="border-b border-royal-border/30 hover:bg-white/5">
                                <td class="p-3 font-mono text-xs text-gold">${u.id}</td>
                                <td class="p-3 font-bold">${u.name}</td>
                                <td class="p-3 text-emerald-glow">$${u.balance.toFixed(2)}</td>
                                <td class="p-3">${vipTitles[u.vip] || '🥉 Bronze'}</td>
                                <td class="p-3"><span class="px-2 py-1 rounded-full text-[10px] font-bold ${u.status === 'active' ? 'status-success' : u.status === 'suspended' ? 'status-pending' : 'status-failed'}">${u.status.toUpperCase()}</span></td>
                                <td class="p-3 text-center">
                                    <button class="bg-neon-mint/20 text-neon-mint px-3 py-1 rounded-lg text-[10px] font-bold mr-1 hover:bg-neon-mint/30">Edit</button>
                                    <button class="bg-neon-red/20 text-neon-red px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-neon-red/30">${u.status === 'active' ? 'Block' : 'Unblock'}</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

    // Search functionality
    document.getElementById('user-search').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const rows = container.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    });
}

// ============================================
// TRANSACTIONS TAB
// ============================================

function renderTransactionsTab(container) {
    const transactions = [
        { id: 'TXN001', user: 'Player_One', amount: 500, type: 'Deposit', provider: 'bKash', txid: 'BK8A3F2K1', status: 'pending' },
        { id: 'TXN002', user: 'LuckyStar', amount: 200, type: 'Withdraw', provider: 'Nagad', txid: 'NG9B4G3L2', status: 'pending' },
        { id: 'TXN003', user: 'BigWinner', amount: 1000, type: 'Deposit', provider: 'bKash', txid: 'BK1C5H4M3', status: 'pending' },
        { id: 'TXN004', user: 'DiamondPro', amount: 750, type: 'Deposit', provider: 'UPI', txid: 'UPI7D6I5N4', status: 'pending' },
    ];

    container.innerHTML = `
        <div class="glass-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead>
                        <tr class="border-b border-royal-border text-white/40 text-xs uppercase">
                            <th class="p-3">ID</th><th class="p-3">User</th><th class="p-3">Amount</th><th class="p-3">Type</th><th class="p-3">Provider</th><th class="p-3">Txr-ID</th><th class="p-3">Status</th><th class="p-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactions.map(tx => `
                            <tr class="border-b border-royal-border/30 hover:bg-white/5" id="row-${tx.id}">
                                <td class="p-3 font-mono text-xs text-gold">${tx.id}</td>
                                <td class="p-3">${tx.user}</td>
                                <td class="p-3 font-bold">$${tx.amount}</td>
                                <td class="p-3"><span class="${tx.type === 'Deposit' ? 'text-neon-mint' : 'text-neon-red'}">${tx.type}</span></td>
                                <td class="p-3">${tx.provider}</td>
                                <td class="p-3 font-mono text-[10px] text-white/50">${tx.txid}</td>
                                <td class="p-3"><span class="status-pending px-2 py-1 rounded-full text-[10px] font-bold">PENDING</span></td>
                                <td class="p-3 text-center">
                                    <button class="bg-neon-mint/20 text-neon-mint px-3 py-1 rounded-lg text-[10px] font-bold mr-1 hover:bg-neon-mint/30" onclick="handleApprove('${tx.id}')">✅ Approve</button>
                                    <button class="bg-neon-red/20 text-neon-red px-3 py-1 rounded-lg text-[10px] font-bold hover:bg-neon-red/30" onclick="handleReject('${tx.id}')">❌ Reject</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function handleApprove(id) {
    const row = document.getElementById('row-' + id);
    if (row) {
        const statusCell = row.querySelector('td:nth-child(7) span');
        if (statusCell) { statusCell.className = 'status-success px-2 py-1 rounded-full text-[10px] font-bold'; statusCell.textContent = 'APPROVED'; }
        row.querySelectorAll('button').forEach(b => b.remove());
        row.insertAdjacentHTML('beforeend', '<td class="p-3 text-center"><span class="text-neon-mint text-xs">✓ Done</span></td>');
    }
}

function handleReject(id) {
    const row = document.getElementById('row-' + id);
    if (row) {
        const statusCell = row.querySelector('td:nth-child(7) span');
        if (statusCell) { statusCell.className = 'status-failed px-2 py-1 rounded-full text-[10px] font-bold'; statusCell.textContent = 'REJECTED'; }
        row.querySelectorAll('button').forEach(b => b.remove());
        row.insertAdjacentHTML('beforeend', '<td class="p-3 text-center"><span class="text-neon-red text-xs">✗ Rejected</span></td>');
    }
}

// ============================================
// RTP CONTROL TAB
// ============================================

function renderRTPTab(container) {
    const rtp = ADMIN_CONFIG.CURRENT_RTP;

    container.innerHTML = `
        <div class="glass-card p-6 text-center max-w-lg mx-auto">
            <div class="text-5xl mb-4">📊</div>
            <h3 class="text-white font-bold text-lg mb-2">Global RTP Control</h3>
            <p class="text-white/40 text-sm mb-6">Adjust the Return-to-Player percentage across all games</p>
            <div class="text-6xl font-bold text-gold balance-glow mb-4" id="rtp-value">${rtp}%</div>
            <div class="mb-6">
                <input type="range" id="rtp-slider" min="${ADMIN_CONFIG.RTP_MIN}" max="${ADMIN_CONFIG.RTP_MAX}" value="${rtp}" step="0.5" class="w-full h-2 bg-royal-card rounded-full appearance-none cursor-pointer" style="accent-color:#d4a843;">
                <div class="flex justify-between text-white/30 text-[10px] mt-2">
                    <span>90%</span><span>92%</span><span>94%</span><span>96%</span><span>98%</span>
                </div>
            </div>
            <p class="text-white/40 text-xs mb-4">⚠️ Changes apply to all new game sessions. Existing sessions are unaffected.</p>
            <button id="save-rtp" class="bg-gold text-royal-dark font-bold px-8 py-3 rounded-xl text-sm hover:scale-105 transition-transform">💾 Save RTP Setting</button>
        </div>`;

    document.getElementById('rtp-slider').addEventListener('input', function() {
        document.getElementById('rtp-value').textContent = this.value + '%';
    });

    document.getElementById('save-rtp').addEventListener('click', function() {
        const newRTP = document.getElementById('rtp-slider').value;
        ADMIN_CONFIG.CURRENT_RTP = parseFloat(newRTP);
        this.textContent = '✅ Saved!';
        setTimeout(() => { this.textContent = '💾 Save RTP Setting'; }, 2000);
    });
}

// ============================================
// ANALYTICS TAB
// ============================================

function renderAnalyticsTab(container) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const values = [1200, 1900, 1500, 2400, 1800, 3200, 2100];

    container.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="glass-card p-4 text-center"><span class="text-white/40 text-xs">Today Deposits</span><p class="text-gold font-bold text-xl mt-1">$4,250</p></div>
                <div class="glass-card p-4 text-center"><span class="text-white/40 text-xs">Today Withdrawals</span><p class="text-neon-red font-bold text-xl mt-1">$1,180</p></div>
                <div class="glass-card p-4 text-center"><span class="text-white/40 text-xs">Active Sessions</span><p class="text-neon-blue font-bold text-xl mt-1">89</p></div>
                <div class="glass-card p-4 text-center"><span class="text-white/40 text-xs">New Users</span><p class="text-emerald-glow font-bold text-xl mt-1">12</p></div>
            </div>
            <div class="glass-card p-4">
                <h4 class="text-white font-bold text-sm mb-4">Weekly Volume</h4>
                <div class="flex items-end justify-between gap-2" style="height:150px;">
                    ${days.map((d, i) => `
                        <div class="flex-1 flex flex-col items-center">
                            <span class="text-white/40 text-[10px] mb-1">$${values[i]}</span>
                            <div class="w-full bg-gradient-to-t from-gold to-gold-light rounded-t-lg" style="height:${(values[i]/3200)*120}px;"></div>
                            <span class="text-white/30 text-[10px] mt-2">${d}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`;
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.authenticateAdmin = authenticateAdmin;
window.logoutAdmin = logoutAdmin;
window.handleApprove = handleApprove;
window.handleReject = handleReject;

console.log('🛡️ Admin Command Center Ready');
console.log('🔑 Master Key: emerald-admin-2024');
