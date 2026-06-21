// ============================================
// ELITE GAMING - AGENT CENTER MODULE
// Referral, Network & Performance
// File: js/agent.js
// ============================================

const AgentModule = {
    activeTab: 'referral',
    referralLink: 'emerald.com/ref/TAC8A3F2K1',

    init(container) {
        this.container = container;
        this.render();
        this.bindEvents();
        this.generateQR();
    },

    render() {
        this.container.innerHTML = `
            <div class="animate-fade-in space-y-4">
                <!-- Tab Switcher -->
                <div class="flex bg-royal-card rounded-xl p-1.5 mb-4 overflow-x-auto scrollbar-hide">
                    <button class="agent-tab flex-shrink-0 px-4 py-2.5 rounded-lg font-display font-bold text-xs transition-all ${this.activeTab === 'referral' ? 'bg-gold text-royal-dark' : 'text-white/50'}" data-tab="referral">🔗 Referral Link</button>
                    <button class="agent-tab flex-shrink-0 px-4 py-2.5 rounded-lg font-display font-bold text-xs transition-all ${this.activeTab === 'network' ? 'bg-gold text-royal-dark' : 'text-white/50'}" data-tab="network">👥 Agent Network</button>
                    <button class="agent-tab flex-shrink-0 px-4 py-2.5 rounded-lg font-display font-bold text-xs transition-all ${this.activeTab === 'performance' ? 'bg-gold text-royal-dark' : 'text-white/50'}" data-tab="performance">📊 Performance</button>
                </div>

                ${this.activeTab === 'referral' ? this.renderReferralTab() : ''}
                ${this.activeTab === 'network' ? this.renderNetworkTab() : ''}
                ${this.activeTab === 'performance' ? this.renderPerformanceTab() : ''}
            </div>
        `;
    },

    renderReferralTab() {
        return `
            <div class="space-y-4">
                <!-- QR Code -->
                <div class="glass-card rounded-2xl p-6 text-center">
                    <h4 class="text-white font-display font-bold text-sm mb-4">Your Referral QR Code</h4>
                    <div id="agent-qr-code" class="bg-white p-3 rounded-xl inline-block mx-auto"></div>
                    <p class="text-white/40 text-[10px] mt-3">Scan to join instantly</p>
                </div>

                <!-- Referral Link -->
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-3">Your Referral Link</h4>
                    <div class="flex items-center space-x-2 bg-royal-card rounded-xl p-3 border border-royal-border">
                        <input type="text" id="referral-link-input" readonly value="${this.referralLink}" class="bg-transparent text-white text-xs flex-1 outline-none font-mono">
                        <button id="copy-referral-btn" class="bg-gold text-royal-dark px-4 py-2 rounded-lg font-display font-bold text-xs hover:scale-105 transition-transform">
                            <i class="fas fa-copy mr-1"></i> Copy
                        </button>
                    </div>
                </div>

                <!-- Share Options -->
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-3">Share Your Link</h4>
                    <div class="grid grid-cols-4 gap-3">
                        ${['facebook','twitter','whatsapp','telegram'].map(platform => `
                            <button class="share-btn bg-royal-card border border-royal-border rounded-xl p-3 text-center hover:border-gold/50 transition-all" data-platform="${platform}">
                                <i class="fab fa-${platform} text-2xl ${platform === 'whatsapp' ? 'text-emerald-glow' : platform === 'telegram' ? 'text-neon-blue' : 'text-gold'}"></i>
                                <span class="text-white/50 text-[9px] block mt-1 capitalize">${platform}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Commission Info -->
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-3">Commission Overview</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-royal-card rounded-xl p-4 text-center">
                            <span class="text-white/40 text-[10px]">Total Referrals</span>
                            <p class="text-gold font-display font-bold text-xl">24</p>
                        </div>
                        <div class="bg-royal-card rounded-xl p-4 text-center">
                            <span class="text-white/40 text-[10px]">Commission Earned</span>
                            <p class="text-emerald-glow font-display font-bold text-xl">$1,250</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderNetworkTab() {
        const subordinates = [
            { name: 'Player_One', id: '421571595', date: '2024-01-15', commission: 125.00 },
            { name: 'LuckyStar', id: '398274611', date: '2024-01-18', commission: 89.50 },
            { name: 'BigWinner', id: '512983477', date: '2024-01-20', commission: 245.00 },
            { name: 'CasinoKing', id: '334561289', date: '2024-01-22', commission: 67.25 },
            { name: 'DiamondPro', id: '445678912', date: '2024-01-25', commission: 312.00 },
        ];

        return `
            <div class="space-y-4">
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-3">New Subordinates</h4>
                    <div class="space-y-2">
                        ${subordinates.map(sub => `
                            <div class="bg-royal-card rounded-xl p-3 flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <div class="w-8 h-8 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center text-royal-dark font-bold text-xs">${sub.name.charAt(0)}</div>
                                    <div>
                                        <span class="text-white text-xs font-display font-bold">${sub.name}</span>
                                        <span class="text-white/40 text-[9px] block">ID: ${sub.id}</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="text-emerald-glow text-xs font-bold">+$${sub.commission.toFixed(2)}</span>
                                    <span class="text-white/30 text-[9px] block">${sub.date}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderPerformanceTab() {
        return `
            <div class="space-y-4">
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-3">Commission Received</h4>
                    <div class="space-y-2">
                        {[
                            { from: 'Player_One', amount: 125.00, date: '2024-01-15', session: 'Dragon Tiger' },
                            { from: 'LuckyStar', amount: 89.50, date: '2024-01-18', session: 'Aviator' },
                            { from: 'BigWinner', amount: 245.00, date: '2024-01-20', session: '777 Slots' },
                            { from: 'CasinoKing', amount: 67.25, date: '2024-01-22', session: 'Roulette' },
                            { from: 'DiamondPro', amount: 312.00, date: '2024-01-25', session: 'Teen Patti' },
                        ].map(comm => `
                            <div class="bg-royal-card rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <span class="text-white text-xs font-display font-bold">${comm.from}</span>
                                    <span class="text-white/40 text-[9px] block">${comm.session} • ${comm.date}</span>
                                </div>
                                <span class="text-emerald-glow text-sm font-display font-bold">+$${comm.amount.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-3 gap-3">
                    <div class="glass-card rounded-xl p-4 text-center">
                        <span class="text-white/40 text-[9px]">Total Earned</span>
                        <p class="text-gold font-display font-bold text-lg">$838.75</p>
                    </div>
                    <div class="glass-card rounded-xl p-4 text-center">
                        <span class="text-white/40 text-[9px]">This Month</span>
                        <p class="text-emerald-glow font-display font-bold text-lg">$312.00</p>
                    </div>
                    <div class="glass-card rounded-xl p-4 text-center">
                        <span class="text-white/40 text-[9px]">Active Refs</span>
                        <p class="text-neon-blue font-display font-bold text-lg">5</p>
                    </div>
                </div>
            </div>
        `;
    },

    generateQR() {
        setTimeout(() => {
            const qrContainer = document.getElementById('agent-qr-code');
            if (!qrContainer) return;

            // Simple SVG QR-like pattern
            const size = 120;
            let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
            svg += `<rect width="${size}" height="${size}" fill="white"/>`;

            // Generate pseudo-QR pattern
            const modules = 21;
            const moduleSize = size / modules;
            const seed = this.referralLink.length;

            for (let row = 0; row < modules; row++) {
                for (let col = 0; col < modules; col++) {
                    // Create deterministic pattern based on referral link
                    const hash = (row * 31 + col * 17 + seed) % 100;
                    if (hash < 40 || (row < 7 && col < 7) || (row < 7 && col > modules - 8) || (row > modules - 8 && col < 7)) {
                        svg += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#0a0e1a"/>`;
                    }
                }
            }

            svg += '</svg>';
            qrContainer.innerHTML = svg;
        }, 100);
    },

    bindEvents() {
        // Tab switching
        this.container.querySelectorAll('.agent-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab;
                this.render();
                this.bindEvents();
                if (this.activeTab === 'referral') this.generateQR();
            });
        });

        // Copy referral link
        const copyBtn = this.container.querySelector('#copy-referral-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const input = this.container.querySelector('#referral-link-input');
                if (input) {
                    input.select();
                    navigator.clipboard.writeText(input.value).then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
                        }, 2000);
                    });
                }
            });
        }

        // Share buttons
        this.container.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                const link = encodeURIComponent(this.referralLink);
                const text = encodeURIComponent('Join Elite Gaming and earn rewards!');
                const urls = {
                    facebook: `https://facebook.com/sharer/sharer.php?u=${link}`,
                    twitter: `https://twitter.com/intent/tweet?url=${link}&text=${text}`,
                    whatsapp: `https://wa.me/?text=${text}%20${link}`,
                    telegram: `https://t.me/share/url?url=${link}&text=${text}`
                };
                window.open(urls[platform], '_blank', 'width=600,height=400');
            });
        });
    }
};

// Export
window.AgentModule = AgentModule;
console.log('👥 Agent Module Loaded');
