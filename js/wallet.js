// ============================================
// ELITE GAMING - WALLET MODULE
// Deposit/Withdraw UI Shell
// File: js/wallet.js
// ============================================

const WalletModule = {
    activeTab: 'deposit',
    selectedProvider: 'bkash',
    selectedAmount: 0,
    txid: '',

    init(container) {
        this.container = container;
        this.render();
        this.bindEvents();
    },

    render() {
        this.container.innerHTML = `
            <div class="animate-fade-in space-y-4">
                <!-- Tab Switcher -->
                <div class="flex bg-royal-card rounded-xl p-1.5 mb-4">
                    <button class="wallet-tab flex-1 py-2.5 rounded-lg font-display font-bold text-xs transition-all ${this.activeTab === 'deposit' ? 'bg-gold text-royal-dark' : 'text-white/50'}" data-tab="deposit">💰 Deposit</button>
                    <button class="wallet-tab flex-1 py-2.5 rounded-lg font-display font-bold text-xs transition-all ${this.activeTab === 'withdraw' ? 'bg-gold text-royal-dark' : 'text-white/50'}" data-tab="withdraw">💸 Withdraw</button>
                </div>

                <!-- Balance Display -->
                <div class="glass-card rounded-2xl p-5 text-center">
                    <span class="text-white/50 text-xs font-display uppercase tracking-wider">Current Balance</span>
                    <p class="text-gold font-display font-bold text-2xl mt-1 balance-glow" id="wallet-balance">$1,250.00</p>
                </div>

                <!-- Provider Selector -->
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-3">Select Provider</h4>
                    <div class="grid grid-cols-3 gap-3">
                        <div class="provider-card glass-card rounded-xl p-3 text-center cursor-pointer border-2 border-gold/50" data-provider="bkash">
                            <div class="w-10 h-10 mx-auto bg-gradient-to-br from-emerald to-emerald-light rounded-full flex items-center justify-center mb-1">
                                <span class="text-white font-display font-bold text-sm">B</span>
                            </div>
                            <span class="text-white text-xs font-display font-bold">bKash</span>
                            <span class="bg-emerald/20 text-emerald-glow text-[9px] px-2 py-0.5 rounded-full font-bold mt-1 inline-block">RECO</span>
                        </div>
                        <div class="provider-card glass-card rounded-xl p-3 text-center cursor-pointer" data-provider="nagad">
                            <div class="w-10 h-10 mx-auto bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center mb-1">
                                <span class="text-royal-dark font-display font-bold text-sm">N</span>
                            </div>
                            <span class="text-white text-xs font-display font-bold">Nagad</span>
                        </div>
                        <div class="provider-card glass-card rounded-xl p-3 text-center cursor-pointer" data-provider="upi">
                            <div class="w-10 h-10 mx-auto bg-gradient-to-br from-neon-blue to-blue-400 rounded-full flex items-center justify-center mb-1">
                                <span class="text-white font-display font-bold text-sm">U</span>
                            </div>
                            <span class="text-white text-xs font-display font-bold">UPI</span>
                        </div>
                    </div>
                </div>

                <!-- Amount Selector -->
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-3">Select Amount</h4>
                    <div class="grid grid-cols-4 gap-2">
                        ${['100','200','500','1000','5000','10000','25000','50000'].map(a => `
                            <button class="amount-chip bg-royal-card border border-royal-border rounded-xl py-3 text-white font-display font-bold text-xs hover:border-gold/50 transition-all" data-amount="${a}">
                                $${parseInt(a).toLocaleString()}
                            </button>
                        `).join('')}
                    </div>
                    <input type="number" id="custom-amount" placeholder="Custom Amount" class="w-full mt-3 bg-royal-card border border-royal-border rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-gold/50 transition-all">
                </div>

                <!-- Transaction ID -->
                <div class="glass-card rounded-2xl p-4">
                    <h4 class="text-white font-display font-bold text-xs mb-2">Transaction ID (Txr-ID)</h4>
                    <input type="text" id="txid-input" placeholder="Enter your transaction ID" class="w-full bg-royal-card border border-royal-border rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-gold/50 transition-all">
                    <div class="mt-3 p-3 bg-royal-card/50 rounded-xl border border-royal-border/30">
                        <p class="text-white/40 text-[10px] font-body leading-relaxed">
                            <span class="text-gold font-bold">⚠️ Instructions:</span> Send exactly the amount above to the merchant number. Paste the Transaction ID you receive from bKash/Nagad after sending payment. Your balance will update after manual verification.
                        </p>
                    </div>
                </div>

                <!-- Submit -->
                <button id="wallet-submit" class="w-full bg-gradient-to-r from-gold to-gold-light text-royal-dark font-display font-bold py-4 rounded-2xl text-sm shadow-xl shadow-gold/20 hover:scale-105 transition-transform">
                    ${this.activeTab === 'deposit' ? '📤 Submit Deposit Request' : '📥 Request Withdrawal'}
                </button>

                <!-- Status Modal (hidden) -->
                <div id="wallet-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div class="glass-card rounded-2xl p-8 text-center max-w-sm mx-4">
                        <div class="w-16 h-16 mx-auto bg-emerald/20 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-check-circle text-emerald-glow text-3xl"></i>
                        </div>
                        <h3 class="text-white font-display font-bold text-lg">Request Submitted!</h3>
                        <p class="text-white/60 text-sm mt-2">Your transaction is being processed. Balance will update after verification.</p>
                        <button id="wallet-modal-close" class="mt-4 bg-gold text-royal-dark font-display font-bold px-8 py-3 rounded-xl text-sm">OK</button>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        // Tab switching
        this.container.querySelectorAll('.wallet-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.activeTab = tab.dataset.tab;
                this.render();
                this.bindEvents();
            });
        });

        // Provider selection
        this.container.querySelectorAll('.provider-card').forEach(card => {
            card.addEventListener('click', () => {
                this.container.querySelectorAll('.provider-card').forEach(c => {
                    c.classList.remove('border-gold/50');
                    c.classList.add('border-royal-border/30');
                });
                card.classList.add('border-gold/50');
                card.classList.remove('border-royal-border/30');
                this.selectedProvider = card.dataset.provider;
            });
        });

        // Amount chips
        this.container.querySelectorAll('.amount-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                this.container.querySelectorAll('.amount-chip').forEach(c => {
                    c.classList.remove('bg-gold/20', 'border-gold/50', 'text-gold');
                });
                chip.classList.add('bg-gold/20', 'border-gold/50', 'text-gold');
                this.selectedAmount = parseInt(chip.dataset.amount);
                const customInput = this.container.querySelector('#custom-amount');
                if (customInput) customInput.value = '';
            });
        });

        // Custom amount
        const customInput = this.container.querySelector('#custom-amount');
        if (customInput) {
            customInput.addEventListener('input', () => {
                this.container.querySelectorAll('.amount-chip').forEach(c => {
                    c.classList.remove('bg-gold/20', 'border-gold/50', 'text-gold');
                });
                this.selectedAmount = parseFloat(customInput.value) || 0;
            });
        }

        // Submit
        const submitBtn = this.container.querySelector('#wallet-submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const txid = this.container.querySelector('#txid-input')?.value?.trim();
                const amount = this.selectedAmount || parseFloat(customInput?.value) || 0;

                if (!amount || amount <= 0) {
                    alert('Please select or enter an amount');
                    return;
                }
                if (!txid) {
                    alert('Please enter your Transaction ID');
                    return;
                }

                // Show success modal
                const modal = this.container.querySelector('#wallet-modal');
                if (modal) modal.classList.remove('hidden');
            });
        }

        // Modal close
        const modalClose = this.container.querySelector('#wallet-modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                const modal = this.container.querySelector('#wallet-modal');
                if (modal) modal.classList.add('hidden');
                // Reset form
                const txidInput = this.container.querySelector('#txid-input');
                const customAmt = this.container.querySelector('#custom-amount');
                if (txidInput) txidInput.value = '';
                if (customAmt) customAmt.value = '';
                this.container.querySelectorAll('.amount-chip').forEach(c => {
                    c.classList.remove('bg-gold/20', 'border-gold/50', 'text-gold');
                });
                this.selectedAmount = 0;
            });
        }
    }
};

// Export
window.WalletModule = WalletModule;
console.log('💳 Wallet Module Loaded');
