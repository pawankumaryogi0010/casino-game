// ============================================
// HOME & OFFERS & INVITE VIEWS
// File: js/views/home.js
// ============================================

function renderHomeView(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <div class="relative mb-4">
                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm"></i>
                <input type="text" placeholder="Search simulations..." class="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm outline-none focus:border-neon-mint/50 transition-all">
            </div>
            <div class="grid grid-cols-2 gap-3">
                ${['Dragon Tiger|🐉|97.5%','Teen Patti|🃏|96.8%','Aviator|✈️|99.1%','Roulette|🎡|97.3%','777 Slots|🎰|96.5%','Baccarat|🎴|98.9%','Blackjack|🃏|99.5%','Fortune|🎡|95.5%'].map((g,i)=>{
                    const [name,icon,rtp]=g.split('|');
                    const hot=i<2?'<span class="absolute top-2 left-2 bg-neon-mint text-obsidian-deep text-[9px] font-bold px-1.5 py-0.5 rounded-full">HOT</span>':'';
                    return `<div class="game-card glass-card rounded-xl overflow-hidden hover:border-neon-mint/50 transition-all shadow-lg cursor-pointer" data-game="${name.toLowerCase().replace(/ /g,'-')}"><div class="h-24 bg-gradient-to-br from-${['red','purple','blue','green','orange','indigo','yellow','pink'][i]}-900/40 to-${['orange','pink','cyan','red','yellow','blue','amber','rose'][i]}-900/20 flex items-center justify-center text-4xl relative">${icon}${hot}</div><div class="p-2.5"><h4 class="text-white text-xs font-bold truncate">${name}</h4><span class="text-neon-mint text-[10px] font-bold bg-neon-mint/10 px-1.5 py-0.5 rounded-full">RTP ${rtp}</span></div></div>`;
                }).join('')}
            </div>
        </div>`;
}

function renderOffersView(container) {
    const offers = [
        {badge:'Welcome Bonus',title:'200% First Deposit',desc:'Min deposit: ₹200',status:'ACTIVE',color:'mint'},
        {badge:'Daily Cashback',title:'10% Unlimited Cashback',desc:'No wagering required',status:'NEW',color:'blue'},
        {badge:'VIP Reward',title:'₹500 Free Chip',desc:'For VIP Level 5+',status:'EXCLUSIVE',color:'gold'},
        {badge:'Weekend Special',title:'50% Reload Bonus',desc:'Every Saturday & Sunday',status:'WEEKLY',color:'mint'}
    ];
    container.innerHTML = `<div class="animate-fade-in"><h3 class="text-white font-bold text-lg mb-4"><i class="fas fa-gift text-neon-gold mr-2"></i>Exclusive Offers</h3><div class="space-y-3">${offers.map(o=>`<div class="glass-card rounded-xl p-4 flex justify-between items-start"><div><span class="text-neon-${o.color} text-[10px] font-bold uppercase">${o.badge}</span><h4 class="text-white font-bold mt-1">${o.title}</h4><p class="text-white/50 text-[10px] mt-1">${o.desc}</p></div><span class="bg-neon-${o.color}/20 text-neon-${o.color} px-3 py-1 rounded-full text-[10px] font-bold">${o.status}</span></div>`).join('')}</div></div>`;
}

function renderInviteView(container) {
    container.innerHTML = `
        <div class="animate-fade-in">
            <h3 class="text-white font-bold text-lg mb-4"><i class="fas fa-users text-neon-blue mr-2"></i>Invite & Earn</h3>
            <div class="glass-card rounded-xl p-4 mb-4"><h4 class="text-neon-mint font-bold text-xs mb-2">Your Referral Link</h4><div class="flex items-center space-x-2 bg-obsidian-deep rounded-lg p-2 border border-white/5"><input type="text" readonly value="emerald.com/ref/user123" class="bg-transparent text-white text-xs flex-1 outline-none" id="referral-link"><button onclick="copyReferral()" class="bg-neon-mint text-obsidian-deep px-3 py-1 rounded-lg text-xs font-bold"><i class="fas fa-copy"></i> Copy</button></div></div>
            <div class="glass-card rounded-xl p-4 mb-4"><h4 class="text-neon-gold font-bold text-xs mb-3">Commission Overview</h4><div class="grid grid-cols-2 gap-3"><div class="bg-obsidian-deep rounded-lg p-3 text-center"><span class="text-white/50 text-[10px]">Total Referrals</span><p class="text-neon-mint font-bold text-lg" id="total-referrals">0</p></div><div class="bg-obsidian-deep rounded-lg p-3 text-center"><span class="text-white/50 text-[10px]">Commission</span><p class="text-neon-gold font-bold text-lg" id="commission-earned">₹0</p></div></div><button class="w-full bg-neon-mint text-obsidian-deep font-bold py-2 rounded-lg mt-3 text-sm">Claim Commission</button></div>
            <div class="glass-card rounded-xl p-4"><h4 class="text-neon-blue font-bold text-xs mb-2">Agent Center</h4><p class="text-white/50 text-[10px] mb-3">Upgrade to agent and earn 30% lifetime commission</p><button class="w-full bg-transparent border border-neon-blue text-neon-blue font-bold py-2 rounded-lg text-sm">Become an Agent</button></div>
        </div>`;
}

function copyReferral() {
    const input = document.getElementById('referral-link');
    if (input) { input.select(); navigator.clipboard.writeText(input.value).then(() => console.log('✅ Copied')); }
}
window.copyReferral = copyReferral;
console.log('✅ Home views loaded');
