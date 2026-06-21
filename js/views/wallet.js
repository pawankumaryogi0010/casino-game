// ============================================
// DEPOSIT / WALLET VIEW
// File: js/views/wallet.js
// ============================================

function renderDepositView(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <h3 class="text-white font-bold text-lg mb-4"><i class="fas fa-wallet text-neon-gold mr-2"></i>Deposit Funds</h3>
            <div class="glass-card rounded-xl p-4 mb-4 text-center"><span class="text-white/50 text-[10px]">Current Balance</span><p class="text-neon-mint font-bold text-2xl" id="deposit-balance-display">0.00</p></div>
            <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="gateway-card glass-card rounded-xl p-3 text-center cursor-pointer border-2 border-neon-mint/50" data-gateway="bkash"><
