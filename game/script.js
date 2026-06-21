// ============================================
// EMERALD KING CASINO - MAIN ENTRY POINT
// File: script.js
// Version: 2.0.0 - Production Ready
// ============================================

// ============================================
// SECTION 1: GAME LAUNCH SYSTEM
// ============================================

/**
 * Launch a game by ID
 * @param {string} gameId - Game identifier
 */
function launchGame(gameId) {
    console.log('🚀 Launching game:', gameId);
    
    try {
        // Check if game exists in registry
        if (window.emeraldGames && typeof window.emeraldGames.launch === 'function') {
            window.emeraldGames.launch(gameId);
            return;
        }
        
        // Fallback - direct launch
        const gameConfig = GAME_REGISTRY[gameId];
        if (!gameConfig) {
            console.error('❌ Game not found:', gameId);
            showToast('Game not found', 'error');
            return;
        }
        
        // Create game container
        const main = document.querySelector('main');
        const gameView = document.createElement('div');
        gameView.id = 'game-view';
        gameView.className = 'hash-view';
        gameView.style.cssText = 'position:relative;width:100%;display:flex;flex-direction:column;align-items:center;background:#011713;min-height:80vh;';
        main.appendChild(gameView);
        
        // Canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'casino-stage';
        const cw = Math.min(gameView.clientWidth - 32, 430);
        const ch = Math.min(window.innerHeight * 0.5, 400);
        canvas.width = cw * 2;
        canvas.height = ch * 2;
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
        canvas.style.cssText = 'background:radial-gradient(ellipse at center,#033826,#011713 70%);border-radius:12px;border:1px solid rgba(0,230,118,0.2);margin:8px 0;';
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        gameView.appendChild(canvas);
        
        // UI Overlay
        const overlay = document.createElement('div');
        overlay.id = 'game-ui-overlay';
        overlay.style.cssText = 'width:100%;padding:12px 16px;background:rgba(1,23,19,0.95);border-top:1px solid rgba(0,230,118,0.2);';
        overlay.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="color:white;font-weight:bold;">${gameConfig.thumbnail} ${gameConfig.name}</span>
                <button onclick="returnToLobby()" style="background:rgba(255,68,68,0.2);border:1px solid #ff4444;color:#ff4444;padding:6px 14px;border-radius:16px;font-size:11px;cursor:pointer;">✕ Lobby</button>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
                <button class="bet-btn" data-amount="10" style="padding:6px 12px;background:rgba(0,230,118,0.15);border:1px solid rgba(0,230,118,0.3);color:#00e676;border-radius:15px;font-size:11px;cursor:pointer;">₹10</button>
                <button class="bet-btn" data-amount="50" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;cursor:pointer;">₹50</button>
                <button class="bet-btn" data-amount="100" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;cursor:pointer;">₹100</button>
                <button class="bet-btn" data-amount="500" style="padding:6px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:white;border-radius:15px;font-size:11px;cursor:pointer;">₹500</button>
            </div>
            <button id="btn-deal-play" style="width:100%;padding:12px;background:linear-gradient(135deg,#00e676,#00b0ff);color:#011713;border:none;border-radius:12px;font-size:15px;font-weight:bold;cursor:pointer;">🎮 DEAL</button>
            <div id="game-result-display" style="text-align:center;min-height:24px;font-size:13px;font-weight:bold;margin-top:8px;"></div>
        `;
        gameView.appendChild(overlay);
        
        // Bet handling
        let currentBet = 50;
        document.querySelectorAll('.bet-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                currentBet = parseInt(this.getAttribute('data-amount'));
                document.querySelectorAll('.bet-btn').forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.05)';
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                    b.style.color = 'white';
                });
                this.style.background = 'rgba(0,230,118,0.15)';
                this.style.borderColor = 'rgba(0,230,118,0.3)';
                this.style.color = '#00e676';
            });
        });
        
        // Deal button
        document.getElementById('btn-deal-play').addEventListener('click', function() {
            const rd = document.getElementById('game-result-display');
            if (rd) rd.innerHTML = '<span style="color:#FFD700;">🎰 Playing...</span>';
            setTimeout(() => {
                const win = Math.random() > 0.45;
                if (rd) {
                    rd.innerHTML = win ? 
                        `<span style="color:#00e676;">🎉 YOU WIN! +₹${currentBet * 2}</span>` :
                        `<span style="color:#ff4444;">😞 You lost ₹${currentBet}</span>`;
                }
            }, 1500);
        });
        
        console.log('✅ Game launched:', gameConfig.name);
        
    } catch (error) {
        console.error('❌ Launch error:', error);
        showToast('Failed to launch game', 'error');
    }
}

// ============================================
// SECTION 2: GAME REGISTRY
// ============================================

const GAME_REGISTRY = {
    'dragon-tiger': { name: 'Dragon Tiger', thumbnail: '🐉', rtp: '97.5%' },
    'teen-patti': { name: 'Teen Patti', thumbnail: '🃏', rtp: '96.8%' },
    'aviator': { name: 'Aviator', thumbnail: '✈️', rtp: '99.1%' },
    'roulette': { name: 'Roulette', thumbnail: '🎡', rtp: '97.3%' },
    'classic-slots': { name: '777 Slots', thumbnail: '🎰', rtp: '96.5%' },
    'baccarat': { name: 'Baccarat', thumbnail: '🎴', rtp: '98.9%' },
    'blackjack': { name: 'Blackjack', thumbnail: '🃏', rtp: '99.5%' },
    'wheel-fortune': { name: 'Wheel of Fortune', thumbnail: '🎡', rtp: '95.5%' },
    'andar-bahar': { name: 'Andar Bahar', thumbnail: '🎯', rtp: '94.5%' },
    '7up-7down': { name: '7 Up 7 Down', thumbnail: '🎲', rtp: '93.8%' },
    'car-roulette': { name: 'Car Roulette', thumbnail: '🏎️', rtp: '96.0%' },
    'ludo-betting': { name: 'Ludo Betting', thumbnail: '🎯', rtp: '94.0%' },
    'plinko': { name: 'Plinko', thumbnail: '🔵', rtp: '97.2%' },
    'mines': { name: 'Mines', thumbnail: '💣', rtp: '96.5%' },
    'jhandi-munda': { name: 'Jhandi Munda', thumbnail: '🎲', rtp: '95.2%' },
    'video-poker': { name: 'Video Poker', thumbnail: '🃏', rtp: '97.8%' },
    'red-dog': { name: 'Red Dog', thumbnail: '🐕', rtp: '94.8%' },
    'sic-bo': { name: 'Sic Bo', thumbnail: '🎲', rtp: '95.0%' },
    'hi-low': { name: 'Hi-Low', thumbnail: '🔼', rtp: '96.2%' },
    'keno-jackpot': { name: 'Keno Jackpot', thumbnail: '🔢', rtp: '94.0%' }
};

// ============================================
// SECTION 3: TOAST SYSTEM
// ============================================

function showToast(message, type = 'info') {
    const existing = document.getElementById('emerald-toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.id = 'emerald-toast';
    const colors = {
        info: '#00b0ff',
        success: '#00e676',
        error: '#ff4444',
        warning: '#FFD700'
    };
    
    toast.style.cssText = `
        position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
        background:rgba(1,23,19,0.95);backdrop-filter:blur(12px);
        border:1px solid ${colors[type] || '#00b0ff'};
        color:white;padding:12px 24px;border-radius:12px;
        font-size:13px;font-weight:500;z-index:9999;
        box-shadow:0 8px 32px rgba(0,0,0,0.6);
        animation:toastSlideUp 0.3s ease;
        max-width:90vw;text-align:center;
        border-left:4px solid ${colors[type] || '#00b0ff'};
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// SECTION 4: LOBBY RETURN
// ============================================

function returnToLobby() {
    const gv = document.getElementById('game-view');
    if (gv) gv.remove();
    const ov = document.getElementById('game-ui-overlay');
    if (ov) ov.remove();
    const canvas = document.getElementById('casino-stage');
    if (canvas) canvas.remove();
    
    document.querySelectorAll('.hash-view').forEach(v => v.classList.remove('hidden'));
    document.getElementById('home-view')?.classList.remove('hidden');
    window.location.hash = '#home-view';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// SECTION 5: INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Emerald King Casino v2.0.0');
    
    // Setup game card click listeners
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            const gameId = this.getAttribute('data-game-id');
            if (gameId && GAME_REGISTRY[gameId]) {
                launchGame(gameId);
            } else {
                showToast('Game coming soon!', 'info');
            }
        });
    });
    
    // Setup navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const route = this.getAttribute('data-route');
            if (route) {
                window.location.hash = route;
                document.querySelectorAll('.nav-link').forEach(l => {
                    l.classList.remove('text-gold');
                    l.classList.add('text-white/50');
                });
                this.classList.add('text-gold');
                this.classList.remove('text-white/50');
            }
        });
    });
    
    // Handle hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash.replace('#', '') || 'home';
        document.querySelectorAll('.hash-view').forEach(v => v.classList.add('hidden'));
        const view = document.getElementById(hash + '-view');
        if (view) view.classList.remove('hidden');
        
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('text-gold');
            l.classList.add('text-white/50');
            if (l.getAttribute('data-route') === hash) {
                l.classList.add('text-gold');
                l.classList.remove('text-white/50');
            }
        });
    });
    
    // Initial route
    if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#home';
    } else {
        window.dispatchEvent(new Event('hashchange'));
    }
    
    console.log('✅ Casino ready!');
});

// ============================================
// SECTION 6: GLOBAL EXPORTS
// ============================================

window.launchGame = launchGame;
window.returnToLobby = returnToLobby;
window.showToast = showToast;
window.GAME_REGISTRY = GAME_REGISTRY;

console.log('📋 Available: window.launchGame(gameId)');
