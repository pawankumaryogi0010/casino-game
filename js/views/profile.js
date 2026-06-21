// ============================================
// PROFILE VIEW
// File: js/views/profile.js
// ============================================

function renderProfileView(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <h3 class="text-white font-bold text-lg mb-4"><i class="fas fa-user-circle text-neon-blue mr-2"></i>My Profile</h3>
            <div class="glass-card rounded-xl p-4 flex items-center space-x-4 mb-4"><div class="w-14 h-14 bg-gradient-to-br from-neon-mint to-emerald-600 rounded-full flex items-center justify-center text-xl">👤</div><div><h4 class="text-white font-bold" id="profile-username">Not Logged In</h4><p class="text-white/50 text-[10px]" id="profile-id">ID: ---</p><p class="text-neon-gold text-[10px] font-bold mt-1" id="profile-vip">VIP Bronze 🥉</p></div></div>
            <div class="glass-card rounded-xl p-4 mb-4"><div class="flex justify-between items-center mb-2"><span class="text-white text-xs font-bold">VIP Progress</span><span class="text-neon-gold text-[10px]" id="vip-progress-text">Bronze → Silver</span></div><div class="w-full bg-obsidian-deep rounded-full h-2.5 border border-white/5 overflow-hidden"><div id="vip-progress-bar" class="bg-gradient-to-r from-neon-mint to-neon-gold h-full rounded-full transition-all duration-500" style="width:0%"></div></div><p class="text-white/50 text-[10px] mt-2" id="vip-next-tier">₹10,000 more to reach Silver tier</p></div>
            <div class="glass-card rounded-xl overflow-hidden divide-y divide-white/5">
                <button class="w-full flex items-center justify-between p-4 text-white text-sm hover:bg-white/5"><span><i class="fas fa-history text-neon-mint mr-3"></i>Transaction History</span><i class="fas fa-chevron-right text-white/20 text-xs"></i></button>
                <button class="w-full flex items-center justify-between p-4 text-white text-sm hover:bg-white/5"><span><i class="fas fa-gem text-neon-blue mr-3"></i>VIP Benefits</span><i class="fas fa-chevron-right text-white/20 text-xs"></i></button>
                <button class="w-full flex items-center justify-between p-4 text-white text-sm hover:bg-white/5"><span><i class="fas fa-headset text-neon-gold mr-3"></i>Customer Support</span><i class="fas fa-chevron-right text-white/20 text-xs"></i></button>
                <button class="w-full flex items-center justify-between p-4 text-white text-sm hover:bg-white/5"><span><i class="fas fa-cog mr-3"></i>Settings</span><i class="fas fa-chevron-right text-white/20 text-xs"></i></button>
                <button id="logout-btn" class="w-full flex items-center justify-between p-4 text-red-400 text-sm hover:bg-red-900/10"><span><i class="fas fa-sign-out-alt mr-3"></i>Logout</span><i class="fas fa-chevron-right text-red-400/20 text-xs"></i></button>
            </div>
        </div>`;
}

console.log('✅ Profile view loaded');
